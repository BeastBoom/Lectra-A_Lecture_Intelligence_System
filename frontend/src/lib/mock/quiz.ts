import { FlashcardDeck, MCQQuestion } from "@/types";

export const mockFlashcardDecks: FlashcardDeck[] = [
  {
    id: "deck-001",
    title: "Neural Network Basics",
    courseId: "course-001",
    cardCount: 5,
    cards: [
      { id: "fc-001", front: "What is a perceptron?", back: "A single-layer neural network unit that computes a weighted sum of inputs, adds a bias, and applies an activation function.", deckId: "deck-001", difficulty: "easy" },
      { id: "fc-002", front: "What is backpropagation?", back: "An algorithm that uses the chain rule to compute gradients of the loss function with respect to each weight, enabling efficient training.", deckId: "deck-001", difficulty: "medium" },
      { id: "fc-003", front: "What is the vanishing gradient problem?", back: "When gradients become extremely small in deep networks with sigmoid/tanh activations, preventing lower layers from learning effectively.", deckId: "deck-001", difficulty: "hard" },
      { id: "fc-004", front: "What does ReLU stand for?", back: "Rectified Linear Unit. It outputs max(0, x), solving the vanishing gradient problem for positive inputs.", deckId: "deck-001", difficulty: "easy" },
      { id: "fc-005", front: "What is a loss function?", back: "A mathematical function that measures the difference between predicted and actual outputs, guiding the learning process.", deckId: "deck-001", difficulty: "easy" },
    ],
  },
  {
    id: "deck-002",
    title: "Linear Algebra Concepts",
    courseId: "course-002",
    cardCount: 4,
    cards: [
      { id: "fc-006", front: "What is an eigenvalue?", back: "A scalar λ such that Av = λv for some non-zero vector v. Eigenvalues represent the scaling factor of eigenvectors under transformation A.", deckId: "deck-002", difficulty: "hard" },
      { id: "fc-007", front: "What is the transpose of a matrix?", back: "A matrix obtained by swapping rows and columns. If A is m×n, then Aᵀ is n×m.", deckId: "deck-002", difficulty: "easy" },
      { id: "fc-008", front: "What is a dot product?", back: "The sum of element-wise products of two vectors. For vectors a and b: a·b = Σ(ai × bi).", deckId: "deck-002", difficulty: "easy" },
      { id: "fc-009", front: "What is PCA?", back: "Principal Component Analysis — a dimensionality reduction technique that projects data onto eigenvectors with the largest eigenvalues.", deckId: "deck-002", difficulty: "medium" },
    ],
  },
];

export const mockMCQs: MCQQuestion[] = [
  {
    id: "mcq-001",
    question: "Which activation function is most commonly used in modern deep neural networks?",
    options: ["Sigmoid", "Tanh", "ReLU", "Step function"],
    correctIndex: 2,
    explanation: "ReLU (Rectified Linear Unit) is preferred because it avoids the vanishing gradient problem and is computationally efficient.",
    topicId: "top-003",
  },
  {
    id: "mcq-002",
    question: "What is the primary purpose of the backpropagation algorithm?",
    options: ["Data preprocessing", "Computing gradients for weight updates", "Generating predictions", "Regularization"],
    correctIndex: 1,
    explanation: "Backpropagation computes gradients of the loss function with respect to network weights using the chain rule.",
    topicId: "top-002",
  },
  {
    id: "mcq-003",
    question: "In matrix multiplication, what must be true about the dimensions of matrices A(m×n) and B?",
    options: ["B must be m×n", "B must be n×p", "B must be p×m", "Any dimensions work"],
    correctIndex: 1,
    explanation: "The number of columns in A must equal the number of rows in B for multiplication to be defined.",
    topicId: "top-004",
  },
  {
    id: "mcq-004",
    question: "What does the self-attention mechanism compute?",
    options: ["Random connections between neurons", "Relevance scores between all token pairs", "Convolutional filters", "Recurrent state updates"],
    correctIndex: 1,
    explanation: "Self-attention computes attention scores between every pair of tokens, allowing the model to capture long-range dependencies.",
    topicId: "top-006",
  },
  {
    id: "mcq-005",
    question: "Which of these is NOT a benefit of using batch normalization?",
    options: ["Faster training", "Reduces internal covariate shift", "Acts as regularization", "Eliminates the need for activation functions"],
    correctIndex: 3,
    explanation: "Batch normalization normalizes layer inputs but activation functions are still required for non-linearity.",
    topicId: "top-001",
  },
];
