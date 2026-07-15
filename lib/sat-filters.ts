export type Skill = { id: string; shortcode: string; name: string };
export type PrimaryClass = { id: string; shortcode: string; name: string; skills: Skill[] };
export type Section = { id: "english" | "math"; name: string; classes: PrimaryClass[] };

export const sections: Section[] = [
  {
    id: "english",
    name: "Reading & Writing",
    classes: [
      {
        id: "information-ideas",
        shortcode: "INI",
        name: "Information and Ideas",
        skills: [
          { id: "central-ideas", shortcode: "CID", name: "Central Ideas and Details" },
          { id: "command-of-evidence", shortcode: "COE", name: "Command of Evidence" },
          { id: "inferences", shortcode: "INF", name: "Inferences" },
        ],
      },
      {
        id: "craft-structure",
        shortcode: "CAS",
        name: "Craft and Structure",
        skills: [
          { id: "words-in-context", shortcode: "WIC", name: "Words in Context" },
          { id: "text-structure", shortcode: "TSP", name: "Text Structure and Purpose" },
          { id: "cross-text", shortcode: "CTC", name: "Cross-Text Connections" },
        ],
      },
      {
        id: "expression-ideas",
        shortcode: "EOI",
        name: "Expression of Ideas",
        skills: [
          { id: "rhetorical-synthesis", shortcode: "SYN", name: "Rhetorical Synthesis" },
          { id: "transitions", shortcode: "TRA", name: "Transitions" },
        ],
      },
      {
        id: "standard-english",
        shortcode: "SEC",
        name: "Standard English Conventions",
        skills: [
          { id: "boundaries", shortcode: "BOU", name: "Boundaries" },
          { id: "form-structure", shortcode: "FSS", name: "Form, Structure, and Sense" },
        ],
      },
    ],
  },
  {
    id: "math",
    name: "Math",
    classes: [
      {
        id: "algebra",
        shortcode: "H",
        name: "Algebra",
        skills: [
          { id: "linear-eq-1var", shortcode: "H.A.", name: "Linear equations in one variable" },
          { id: "linear-eq-2var", shortcode: "H.C.", name: "Linear equations in two variables" },
          { id: "linear-functions", shortcode: "H.B.", name: "Linear functions" },
          { id: "systems", shortcode: "H.D.", name: "Systems of two linear equations in two variables" },
          { id: "linear-inequalities", shortcode: "H.E.", name: "Linear inequalities in one or two variables" },
        ],
      },
      {
        id: "advanced-math",
        shortcode: "P",
        name: "Advanced Math",
        skills: [
          { id: "nonlinear-functions", shortcode: "P.C.", name: "Nonlinear functions" },
          { id: "nonlinear-eq", shortcode: "P.B.", name: "Nonlinear equations and systems" },
          { id: "equivalent-expr", shortcode: "P.A.", name: "Equivalent expressions" },
        ],
      },
      {
        id: "problem-solving",
        shortcode: "Q",
        name: "Problem-Solving and Data Analysis",
        skills: [
          { id: "ratios-rates", shortcode: "Q.A.", name: "Ratios, rates, proportional relationships, and units" },
          { id: "percentages", shortcode: "Q.B.", name: "Percentages" },
          { id: "distributions", shortcode: "Q.C.", name: "One-variable data: Distributions and measures of center and spread" },
          { id: "two-variable", shortcode: "Q.D.", name: "Two-variable data: Models and scatterplots" },
          { id: "probability", shortcode: "Q.E.", name: "Probability and conditional probability" },
          { id: "inference-stats", shortcode: "Q.F.", name: "Inference from sample statistics and margin of error" },
          { id: "evaluating-stats", shortcode: "Q.G.", name: "Evaluating statistical claims" },
        ],
      },
      {
        id: "geometry-trig",
        shortcode: "S",
        name: "Geometry and Trigonometry",
        skills: [
          { id: "area-volume", shortcode: "S.A.", name: "Area and volume" },
          { id: "lines-angles", shortcode: "S.B.", name: "Lines, angles, and triangles" },
          { id: "right-triangles", shortcode: "S.C.", name: "Right triangles and trigonometry" },
          { id: "circles", shortcode: "S.D.", name: "Circles" },
        ],
      },
    ],
  },
];

export type FilterSelection = {
  section: "english" | "math";
  classes: Record<string, boolean>;
  skills: Record<string, boolean>;
};
