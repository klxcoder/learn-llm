// --- Training: Build unigram, bigram, and trigram frequency models ---
function trainModels(text) {
  const words = text.split(/\s+/);
  const unigrams = {}, bigrams = {}, trigrams = {};
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    unigrams[w] = (unigrams[w] || 0) + 1;
    if (i < words.length - 1) {
      const next = words[i + 1];
      bigrams[w] = bigrams[w] || {};
      bigrams[w][next] = (bigrams[w][next] || 0) + 1;
    }
    if (i < words.length - 2) {
      const key = words[i] + " " + words[i + 1];
      const next = words[i + 2];
      trigrams[key] = trigrams[key] || {};
      trigrams[key][next] = (trigrams[key][next] || 0) + 1;
    }
  }
  return { unigrams, bigrams, trigrams };
}

// --- Helper: Sample from a distribution with temperature, topK, and topP ---
function sampleFromDistribution(distribution, temperature = 1, topK = null, topP = null) {
  // Apply temperature scaling.
  let dist = distribution.map(d => ({
    word: d.word,
    prob: Math.pow(d.prob, 1 / temperature)
  }));
  let sum = dist.reduce((s, d) => s + d.prob, 0);
  dist = dist.map(d => ({ word: d.word, prob: d.prob / sum }));

  // Apply topK filtering.
  if (topK && topK < dist.length) {
    dist.sort((a, b) => b.prob - a.prob);
    dist = dist.slice(0, topK);
    sum = dist.reduce((s, d) => s + d.prob, 0);
    dist = dist.map(d => ({ word: d.word, prob: d.prob / sum }));
  }

  // Apply topP (nucleus) filtering.
  if (topP && topP < 1) {
    dist.sort((a, b) => b.prob - a.prob);
    let cumulative = 0, nucleus = [];
    for (let d of dist) {
      cumulative += d.prob;
      nucleus.push(d);
      if (cumulative >= topP) break;
    }
    sum = nucleus.reduce((s, d) => s + d.prob, 0);
    dist = nucleus.map(d => ({ word: d.word, prob: d.prob / sum }));
  }

  // Sample from the final distribution.
  let r = Math.random();
  for (let d of dist) {
    r -= d.prob;
    if (r < 0) return d.word;
  }
  return dist[dist.length - 1].word;
}

// --- Generation: Interpolated n-gram sampling ---
// Instead of a strict backoff, we compute a combined probability for every candidate.
function generateTextInterpolated(models, startWords, numWords = 50, options = {}) {
  const {
    temperature = 1,
    topK = null,
    topP = null,
    // Lambda weights for unigram, bigram, and trigram contributions.
    lambdas = { unigram: 0.2, bigram: 0.3, trigram: 0.5 }
  } = options;

  const words = startWords.split(" ");
  // Precompute total count for unigrams.
  const totalUnigrams = Object.values(models.unigrams).reduce((a, b) => a + b, 0);

  while (words.length < numWords) {
    const candidateSet = Object.keys(models.unigrams);
    let distribution = [];
    const lastWord = words[words.length - 1];
    const trigramContext = words.length >= 2 ? words.slice(-2).join(" ") : null;

    candidateSet.forEach(candidate => {
      // Trigram probability (if context exists).
      let pTri = 0;
      if (trigramContext && models.trigrams[trigramContext] && models.trigrams[trigramContext][candidate]) {
        const triTotal = Object.values(models.trigrams[trigramContext]).reduce((a, b) => a + b, 0);
        pTri = models.trigrams[trigramContext][candidate] / triTotal;
      }

      // Bigram probability (if last word exists).
      let pBi = 0;
      if (lastWord && models.bigrams[lastWord] && models.bigrams[lastWord][candidate]) {
        const biTotal = Object.values(models.bigrams[lastWord]).reduce((a, b) => a + b, 0);
        pBi = models.bigrams[lastWord][candidate] / biTotal;
      }

      // Unigram probability.
      const pUni = models.unigrams[candidate] / totalUnigrams;

      // Combined (interpolated) probability.
      const pCombined = lambdas.trigram * pTri + lambdas.bigram * pBi + lambdas.unigram * pUni;
      distribution.push({ word: candidate, prob: pCombined });
    });

    // Normalize distribution.
    const sumDist = distribution.reduce((s, d) => s + d.prob, 0);
    distribution = distribution.map(d => ({ word: d.word, prob: d.prob / sumDist }));

    // Sample next word.
    const nextWord = sampleFromDistribution(distribution, temperature, topK, topP);
    words.push(nextWord);
  }

  return words.join(" ");
}

// --- Example Usage ---
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";

const models = trainModels(trainingText);
const generatedText = generateTextInterpolated(models, "The dog", 30, {
  temperature: 0.8,
  topK: 5,
  topP: 0.9,
  lambdas: { unigram: 0.2, bigram: 0.3, trigram: 0.5 }
});
console.log(generatedText);
