import { useMemo } from 'react';
import type { CallObject } from '../lib/types';

export default function Feedback({ call }: { call: CallObject }) {
  const analysis = call?.analysis || {} as any;
  const rows = useMemo(() => {
    const data: { Aspect: string; Feedback: string }[] = [];
    const order = [
      'clarityOfExpression','reasoningAbility','analyticalDepth','currentAffairsAwareness','ethicalJudgment','personalityTraits','socialAwareness','hobbiesDepth','overallImpression','strengths','areasForImprovement','overallFeedback'
    ];
    const structured = (analysis as any).structuredData || {};
    for (const k of order) if (structured[k]) data.push({ Aspect: k, Feedback: structured[k] });
    return data;
  }, [call]);
  const rating = typeof analysis?.successEvaluation === 'string' ? analysis?.successEvaluation : (analysis?.successEvaluation?.overallRating || '');
  const justification = typeof analysis?.successEvaluation === 'object' ? (analysis?.successEvaluation as any)?.justification : '';
  return (
    <div className="mt-4">
      {analysis?.summary && <p className="mb-3 opacity-90">{analysis.summary}</p>}
      <div className="overflow-x-auto rounded border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900"><tr><th className="text-left p-2">Aspect</th><th className="text-left p-2">Feedback</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-neutral-950 even:bg-neutral-900">
                <td className="p-2 whitespace-nowrap text-neutral-300">{r.Aspect}</td>
                <td className="p-2">{r.Feedback}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-2" colSpan={2}>No analysis available yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {rating && <div className="mt-3">Overall Success Rating: <strong>{rating}</strong></div>}
      {justification && <div className="opacity-80 text-sm">{justification}</div>}
    </div>
  );
}
