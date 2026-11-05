#!/usr/bin/env python3
"""Compact paired evaluation evidence without discarding adverse cases."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np


def summarize(report):
    groups = {}
    primary_rows = [row for row in report['rows'] if row['model'].endswith('_python')]
    primary_timing = [row for row in report['timing'] if row['model'].endswith('_python')]
    for row in primary_rows:
        key = tuple(row[field] for field in ['family', 'model', 'condition', 'reference', 'phase'])
        group = groups.setdefault(key, {'cases': 0})
        group['cases'] += 1
        for field in ['frames', 'correct', 'acceptedCorrect', 'accepted', 'octaveErrors', 'falseVoiced']:
            if field in row['metrics']:
                group[field] = group.get(field, 0) + row['metrics'][field]
    scores = []
    for key, counts in groups.items():
        scores.append({**dict(zip(['family', 'model', 'condition', 'reference', 'phase'], key)), **counts,
                       'matchRate': counts['correct'] / counts['frames'] if counts['frames'] and 'correct' in counts else None,
                       'acceptedRecall': counts['acceptedCorrect'] / counts['frames'] if counts['frames'] and 'acceptedCorrect' in counts else None})
    timing = []
    keys = {(row['family'], row['model'], row['condition'], row['reference']) for row in primary_timing}
    for key in sorted(keys):
        selected = [row for row in primary_timing if tuple(row[field] for field in ['family', 'model', 'condition', 'reference']) == key]
        eligible = [row for row in selected if row['eligible']]
        result = {**dict(zip(['family', 'model', 'condition', 'reference'], key)), 'cases': len(selected), 'eligible': len(eligible)}
        for field in ['rawStable20msAtMs', 'acceptedStable20msAtMs']:
            values = [row[field] for row in eligible if row[field] is not None]
            result[field] = {'reached': len(values), 'notReached': len(eligible) - len(values),
                             'medianSuccessfulMs': float(np.median(values)) if values else None,
                             'p90SuccessfulMs': float(np.quantile(values, 0.9)) if values else None}
        timing.append(result)
    conflicts = []
    for case in report['records']:
        value = case['referenceSummary']['sustain']['midiMedian']
        if value is not None and abs(value - case['midi']) > 0.5:
            conflicts.append({'id': case['id'], 'nominalMidi': case['midi'], 'consensusMedianMidi': value,
                              'status': 'unresolved label/partial/octave conflict; not automatically relabelled'})
    score_columns = ['id', 'model', 'condition', 'reference', 'phase', 'frames', 'correct', 'acceptedCorrect',
                     'accepted', 'octaveErrors', 'falseVoiced', 'medianSignedCents', 'medianPrediction']
    score_rows = [[{**row, **row['metrics']}.get(field) for field in score_columns] for row in primary_rows]
    by_key = {(row['id'], row['model'], row['condition'], row['reference'], row['phase']): row for row in report['rows']}
    backend_disagreements = []
    for row in report['rows']:
        if row['model'].endswith('_python'):
            continue
        source = by_key[(row['id'], row['model'] + '_python', row['condition'], row['reference'], row['phase'])]
        differences = {field: [source['metrics'][field], value] for field, value in row['metrics'].items()
                       if field not in ['medianSignedCents', 'medianPrediction'] and value != source['metrics'][field]}
        if differences:
            backend_disagreements.append({key: value for key, value in row.items() if key != 'metrics'} | {'differences': differences})
    timing_columns = ['id', 'model', 'condition', 'reference', 'eligible', 'rawStable20msAtMs', 'acceptedStable20msAtMs']
    return {**{key: report[key] for key in ['partition', 'manifestSha256', 'upstreamCommit', 'checkpointSha256', 'modelSha256',
                                           'onnxSourceParity', 'exportPassed', 'packages', 'protocol', 'productionChanged']},
            'samples': len(report['records']), 'sourceGroups': len({case['instrument'] for case in report['records']}),
            'records': report['records'], 'labelConflicts': conflicts, 'familyScores': scores, 'familyTiming': timing,
            'onnxComparison': report['onnxComparison'], 'pythonPaddingAblation': report['pythonPaddingAblation'],
            'backendMetricDisagreements': backend_disagreements,
            'scoreColumns': score_columns, 'scoreRows': score_rows, 'timingColumns': timing_columns,
            'timingRows': [[row[field] for field in timing_columns] for row in primary_timing]}


def format_json(value, level=0):
    """Keep tabular primitive rows on one line; other structures remain reviewable."""
    if isinstance(value, dict):
        if not value:
            return '{}'
        return '{\n' + ',\n'.join('  ' * (level + 1) + json.dumps(key) + ': ' + format_json(item, level + 1) for key, item in value.items()) + '\n' + '  ' * level + '}'
    if isinstance(value, list) and any(isinstance(item, (dict, list)) for item in value):
        return '[\n' + ',\n'.join('  ' * (level + 1) + format_json(item, level + 1) for item in value) + '\n' + '  ' * level + ']'
    return json.dumps(value, ensure_ascii=False, allow_nan=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--holdout', required=True, type=Path)
    parser.add_argument('--development', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = {'version': 1, 'scope': 'Offline evidence; no automatic production promotion or retraining.',
              'referenceMeaning': 'Acoustic consensus is a diagnostic estimate, not manually annotated ground truth; label conflicts retained.',
              'timingMeaning': 'Successful-case times are conditional; always read eligible/reached/notReached counts.',
              'inputs': {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in [('holdoutReportSha256', args.holdout), ('developmentReportSha256', args.development)]},
              'holdout': summarize(json.loads(args.holdout.read_text())), 'development': summarize(json.loads(args.development.read_text()))}
    args.output.write_text(format_json(result) + '\n')


if __name__ == '__main__':
    main()
