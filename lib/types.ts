export type QuestionMeta = {
  id: string;
  subject: "math" | "english";
  primary_class_id: string;
  skill_id: string;
  question_type: "mcq" | "spr";
  difficulty: "E" | "M" | "H";
  sat_question_id: string | null;
  primary_class: { shortcode: string };
  skill: { shortcode: string };
};

export type Option = {
  id: string;
  question_id: string;
  label: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
};

export type QuestionFull = QuestionMeta & {
  stimulus: string | null;
  stem: string;
  image_url: string | null;
  rationale: string | null;
  accepted_answers: string[] | null;
  source: string;
  options: Option[];
};

export type QuestionState = {
  selected?: string;
  textAnswer?: string;
  marked: boolean;
  eliminated: Record<string, boolean>;
  checked?: boolean;
  correct?: boolean;
};

export type AnswerStore = Record<string, QuestionState>;
