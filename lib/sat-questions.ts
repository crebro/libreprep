export type Choice = { letter: "A" | "B" | "C" | "D"; text: string };
export type Question = {
  id: number;
  passage?: string;
  prompt: string;
  choices: Choice[];
  correct: "A" | "B" | "C" | "D";
};

export const questions: Question[] = [
  {
    id: 1,
    passage:
      "Researchers and conservationists stress that biodiversity loss due to invasive species is ______. For example, people can take simple steps such as washing their footwear after travel to avoid introducing potentially invasive organisms into new environments.",
    prompt: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      { letter: "A", text: "preventable" },
      { letter: "B", text: "undeniable" },
      { letter: "C", text: "common" },
      { letter: "D", text: "concerning" },
    ],
    correct: "A",
  },
  {
    id: 2,
    passage:
      "The Great Barrier Reef, off the coast of Australia, is the largest coral reef system in the world. It stretches over 2,300 kilometers and is home to thousands of species of fish, mollusks, and other marine life. Scientists studying the reef have observed that rising ocean temperatures have led to widespread coral bleaching events.",
    prompt: "Based on the text, what can be concluded about the Great Barrier Reef?",
    choices: [
      { letter: "A", text: "It is uninhabited by marine life." },
      { letter: "B", text: "It is affected by climate-related changes." },
      { letter: "C", text: "It has fully recovered from bleaching." },
      { letter: "D", text: "It is smaller than previously thought." },
    ],
    correct: "B",
  },
  {
    id: 3,
    passage:
      "In her 2019 paper, historian Dr. Amara Okonkwo argues that trade routes across the Sahara were far more extensive than previously documented. She cites recently uncovered manuscripts from Timbuktu as evidence.",
    prompt: "Which choice best states the main idea of the text?",
    choices: [
      { letter: "A", text: "Timbuktu manuscripts are being auctioned." },
      { letter: "B", text: "The Sahara had no trade routes." },
      { letter: "C", text: "New evidence expands understanding of Saharan trade." },
      { letter: "D", text: "Dr. Okonkwo has retired from research." },
    ],
    correct: "C",
  },
  {
    id: 4,
    prompt: "If 3x + 7 = 22, what is the value of x?",
    choices: [
      { letter: "A", text: "3" },
      { letter: "B", text: "5" },
      { letter: "C", text: "7" },
      { letter: "D", text: "15" },
    ],
    correct: "B",
  },
  {
    id: 5,
    prompt:
      "A circle in the xy-plane has center (2, -3) and radius 5. Which of the following is an equation of the circle?",
    choices: [
      { letter: "A", text: "(x - 2)² + (y + 3)² = 25" },
      { letter: "B", text: "(x + 2)² + (y - 3)² = 25" },
      { letter: "C", text: "(x - 2)² + (y + 3)² = 5" },
      { letter: "D", text: "(x + 2)² + (y - 3)² = 5" },
    ],
    correct: "A",
  },
];
