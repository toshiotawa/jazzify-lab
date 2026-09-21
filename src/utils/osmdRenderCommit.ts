export const shouldCommitOsmdRender = (startedGeneration: number, currentGeneration: number): boolean =>
  startedGeneration === currentGeneration;

export const shouldShowOsmdRenderError = (params: {
  isCurrent: boolean;
  scoreAlreadyPainted: boolean;
}): boolean => params.isCurrent && !params.scoreAlreadyPainted;
