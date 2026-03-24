/**
 * MusicXML の volta なし forward/backward 繰り返しを展開し、
 * 小節番号を振り直した score-partwise 文字列を返す。
 * progression_timing 用のノーツ数・OSMD表示の一致に使用。
 */

function barlineChild(measure: Element, location: 'left' | 'right'): Element | null {
  for (const c of Array.from(measure.children)) {
    if (c.tagName === 'barline' && c.getAttribute('location') === location) {
      return c;
    }
  }
  return null;
}

function hasRepeatForwardAtMeasureStart(measure: Element): boolean {
  const bl = barlineChild(measure, 'left');
  return !!(bl?.querySelector('repeat[direction="forward"]'));
}

function hasRepeatBackwardAtMeasureEnd(measure: Element): boolean {
  const bl = barlineChild(measure, 'right');
  return !!(bl?.querySelector('repeat[direction="backward"]'));
}

function getBackwardRepeatTimes(measure: Element): number {
  const bl = barlineChild(measure, 'right');
  const rep = bl?.querySelector('repeat[direction="backward"]') as Element | null;
  if (!rep) return 2;
  const t = rep.getAttribute('times');
  if (!t) return 2;
  const n = parseInt(t, 10);
  return !isNaN(n) && n >= 2 ? n : 2;
}

function matchingBackwardIndex(startIdx: number, measures: Element[]): number {
  if (!hasRepeatForwardAtMeasureStart(measures[startIdx])) {
    return -1;
  }
  let depth = 1;
  for (let k = startIdx + 1; k < measures.length; k++) {
    if (hasRepeatForwardAtMeasureStart(measures[k])) {
      depth += 1;
    }
    if (hasRepeatBackwardAtMeasureEnd(measures[k])) {
      depth -= 1;
      if (depth === 0) {
        return k;
      }
    }
  }
  return -1;
}

/** repeat を含む barline 要素をクローンから除去 */
function stripRepeatBarlines(measure: Element): void {
  Array.from(measure.children).forEach((c) => {
    if (c.tagName === 'barline' && c.querySelector('repeat')) {
      c.remove();
    }
  });
}

function cloneMeasure(doc: Document, source: Element): Element {
  const c = source.cloneNode(true) as Element;
  stripRepeatBarlines(c);
  return c;
}

function expandPartMeasures(doc: Document, partEl: Element): void {
  const measures = Array.from(partEl.children).filter((c) => c.tagName === 'measure') as Element[];
  if (measures.length === 0) return;

  const expanded: Element[] = [];
  let i = 0;
  while (i < measures.length) {
    const m = measures[i];
    if (hasRepeatForwardAtMeasureStart(m)) {
      const j = matchingBackwardIndex(i, measures);
      if (j < 0) {
        expanded.push(cloneMeasure(doc, m));
        i += 1;
        continue;
      }
      const times = getBackwardRepeatTimes(measures[j]);
      for (let t = 0; t < times; t++) {
        for (let k = i; k <= j; k++) {
          expanded.push(cloneMeasure(doc, measures[k]));
        }
      }
      i = j + 1;
    } else {
      expanded.push(cloneMeasure(doc, m));
      i += 1;
    }
  }

  expanded.forEach((el, idx) => {
    el.setAttribute('number', String(idx + 1));
  });

  while (partEl.firstChild) {
    partEl.removeChild(partEl.firstChild);
  }
  expanded.forEach((el) => partEl.appendChild(el));
}

/**
 * 各パートの measure に forward/backward repeat があれば展開する。
 * 既に展開済み（repeat なし）なら実質コピーのみ。
 */
export function expandMusicXmlRepeats(xmlText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parts = Array.from(doc.querySelectorAll('score-partwise > part'));
  if (parts.length === 0) {
    return xmlText;
  }
  parts.forEach((partEl) => expandPartMeasures(doc, partEl as Element));
  return new XMLSerializer().serializeToString(doc);
}

/**
 * 先頭に「全休符1小節」を追加（カウントイン同期用）。
 * 最初の小節の attributes を複製し、duration は 4拍分（divisions×4）。
 */
export function prependFullMeasureCountInRest(xmlText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const partEl = doc.querySelector('score-partwise > part') as Element | null;
  if (!partEl) return xmlText;

  const measures = Array.from(partEl.children).filter((c) => c.tagName === 'measure') as Element[];
  if (measures.length === 0) return xmlText;

  const first = measures[0];
  let attrsEl: Element | null = null;
  for (const c of Array.from(first.children)) {
    if (c.tagName === 'attributes') {
      attrsEl = c;
      break;
    }
  }
  const divisionsEl = first.querySelector('attributes divisions');
  const divisions = divisionsEl?.textContent ? parseInt(divisionsEl.textContent, 10) : 12;
  const dur = !isNaN(divisions) && divisions > 0 ? divisions * 4 : 48;

  const newMeasure = doc.createElement('measure');
  newMeasure.setAttribute('number', '1');

  if (attrsEl) {
    newMeasure.appendChild(attrsEl.cloneNode(true));
  }

  const noteEl = doc.createElement('note');
  const restEl = doc.createElement('rest');
  noteEl.appendChild(restEl);
  const durEl = doc.createElement('duration');
  durEl.textContent = String(dur);
  noteEl.appendChild(durEl);
  const voiceEl = doc.createElement('voice');
  voiceEl.textContent = '1';
  noteEl.appendChild(voiceEl);
  newMeasure.appendChild(noteEl);

  partEl.insertBefore(newMeasure, first);

  measures.forEach((m, idx) => {
    m.setAttribute('number', String(idx + 2));
  });

  return new XMLSerializer().serializeToString(doc);
}
