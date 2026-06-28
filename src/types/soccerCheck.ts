export type IssueCategory =
  | '認知・視野'
  | 'ポジショニング・サポート'
  | '技術：パス・コントロール'
  | 'ドリブル・1対1'
  | '守備'
  | 'メンタル・思考'
  | 'フィジカル・身体操作';

export interface SoccerIssue {
  id: string;
  category: IssueCategory;
  originalTitle: string;
  displayTitle: string;
  commonScene: string;
  causes: {
    cognition: string;
    technique: string;
    bodyControl: string;
    interpersonal: string;
  };
  voicePrompts: string[];
  awareness: string;
}

export type IssueScore = 0 | 1 | 2;

export interface SoccerIssueAnswers {
  [issueId: string]: IssueScore;
}

export interface SoccerCheckResult {
  topIssues: Array<{
    issueId: string;
    category: IssueCategory;
    displayTitle: string;
    score: IssueScore;
  }>;
  allAnswers: SoccerIssueAnswers;
  createdAt: string;
}
