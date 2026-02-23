import { Topic, Note } from "@/types";

export const mockTopics: Topic[] = [
  { id: "top-001", title: "Perceptron Model", summary: "The foundational unit of neural networks, modeling a single biological neuron with weighted inputs and an activation function.", audioId: "aud-001", keywords: ["perceptron", "activation", "weights"] },
  { id: "top-002", title: "Backpropagation Algorithm", summary: "The chain-rule-based method for computing gradients layer by layer, enabling efficient training of deep networks.", audioId: "aud-001", keywords: ["gradients", "chain-rule", "training"] },
  { id: "top-003", title: "Activation Functions", summary: "Non-linear functions applied at each neuron: sigmoid, tanh, ReLU, and modern variants like GELU and Swish.", audioId: "aud-001", keywords: ["ReLU", "sigmoid", "non-linearity"] },
  { id: "top-004", title: "Matrix Multiplication", summary: "Core operation for transforming data through network layers, optimized via GPU parallelization.", audioId: "aud-002", keywords: ["matrices", "GPU", "dot-product"] },
  { id: "top-005", title: "Eigenvalue Decomposition", summary: "Factorizing matrices to understand principal components and variance directions in high-dimensional data.", audioId: "aud-002", keywords: ["eigenvectors", "PCA", "decomposition"] },
  { id: "top-006", title: "Self-Attention Mechanism", summary: "The core innovation of Transformers: computing relevance scores between all token pairs in a sequence.", audioId: "aud-005", keywords: ["attention", "queries", "keys", "values"] },
];

export const mockNotes: Note[] = [
  {
    id: "note-001",
    courseId: "course-001",
    unitId: "unit-001",
    topicId: "top-001",
    title: "Understanding the Perceptron",
    content: "## The Perceptron Model\n\nThe perceptron is the simplest form of a neural network.\n\n### Key Formula\n`output = activation(Σ(wi * xi) + bias)`\n\n### Key Points\n- Takes n inputs with corresponding weights\n- Computes weighted sum plus bias\n- Applies activation function for non-linearity\n- Single perceptron can only solve linearly separable problems\n\n### Historical Context\nInvented by Frank Rosenblatt in 1958 at the Cornell Aeronautical Laboratory.",
    sources: ["audio"],
    updatedAt: "2026-02-20T12:00:00Z",
    isAiGenerated: true,
  },
  {
    id: "note-002",
    courseId: "course-001",
    unitId: "unit-001",
    topicId: "top-002",
    title: "Backpropagation Explained",
    content: "## Backpropagation\n\nThe algorithm that makes training deep networks feasible.\n\n### Steps\n1. Forward pass: compute predictions\n2. Compute loss function\n3. Backward pass: compute gradients via chain rule\n4. Update weights using optimizer (SGD, Adam, etc.)\n\n### Important Notes\n- Vanishing gradients affect deep sigmoid networks\n- Gradient clipping prevents exploding gradients\n- Learning rate scheduling improves convergence",
    sources: ["audio"],
    updatedAt: "2026-02-20T12:30:00Z",
    isAiGenerated: true,
  },
  {
    id: "note-003",
    courseId: "course-002",
    unitId: "unit-003",
    topicId: "top-004",
    title: "Linear Algebra Essentials",
    content: "## Matrix Operations for ML\n\n### Key Operations\n- Matrix multiplication: (m×n) · (n×p) = (m×p)\n- Transpose: swap rows and columns\n- Inverse: A⁻¹ such that A·A⁻¹ = I\n\n### GPU Acceleration\nModern GPUs can perform thousands of matrix operations in parallel, making deep learning computationally feasible.",
    sources: ["audio", "document"],
    updatedAt: "2026-02-19T16:00:00Z",
    isAiGenerated: false,
  },
];
