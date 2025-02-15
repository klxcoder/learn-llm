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

// --- Advanced Beam Search Generation with Interpolation and Sampling Filters ---
function generateTextBeamSearch(models, startWords, numWords = 50, options = {}) {
  const {
    beamWidth = 3,
    temperature = 1,
    topK = null,
    topP = null,
    // Lambda weights for trigram, bigram, and unigram interpolation.
    lambdas = { unigram: 0.2, bigram: 0.3, trigram: 0.5 }
  } = options;

  const vocabulary = Object.keys(models.unigrams);
  const totalUnigrams = Object.values(models.unigrams).reduce((a, b) => a + b, 0);

  // Each beam is an object with a 'sequence' (array of words) and a cumulative 'prob'.
  let beams = [{ sequence: startWords.split(" "), prob: 1 }];

  while (beams.length > 0 && beams[0].sequence.length < numWords) {
    const newBeams = [];
    for (let beam of beams) {
      const seq = beam.sequence;
      const lastWord = seq[seq.length - 1];
      const trigramContext = seq.length >= 2 ? seq.slice(-2).join(" ") : null;

      // Compute interpolated probabilities for each candidate in the vocabulary.
      let candidates = [];
      for (let word of vocabulary) {
        let pTri = 0;
        if (trigramContext && models.trigrams[trigramContext] && models.trigrams[trigramContext][word]) {
          const triTotal = Object.values(models.trigrams[trigramContext]).reduce((a, b) => a + b, 0);
          pTri = models.trigrams[trigramContext][word] / triTotal;
        }
        let pBi = 0;
        if (lastWord && models.bigrams[lastWord] && models.bigrams[lastWord][word]) {
          const biTotal = Object.values(models.bigrams[lastWord]).reduce((a, b) => a + b, 0);
          pBi = models.bigrams[lastWord][word] / biTotal;
        }
        const pUni = models.unigrams[word] / totalUnigrams;
        const pCombined = lambdas.trigram * pTri + lambdas.bigram * pBi + lambdas.unigram * pUni;
        candidates.push({ word, prob: pCombined });
      }

      // Normalize candidate probabilities.
      let sumProb = candidates.reduce((s, c) => s + c.prob, 0);
      candidates = candidates.map(c => ({ word: c.word, prob: c.prob / sumProb }));

      // Apply temperature scaling: sharpen or flatten the distribution.
      candidates = candidates.map(c => ({ word: c.word, prob: Math.pow(c.prob, 1 / temperature) }));
      sumProb = candidates.reduce((s, c) => s + c.prob, 0);
      candidates = candidates.map(c => ({ word: c.word, prob: c.prob / sumProb }));

      // Apply topK filtering if specified.
      if (topK && topK < candidates.length) {
        candidates.sort((a, b) => b.prob - a.prob);
        candidates = candidates.slice(0, topK);
        sumProb = candidates.reduce((s, c) => s + c.prob, 0);
        candidates = candidates.map(c => ({ word: c.word, prob: c.prob / sumProb }));
      }

      // Apply topP (nucleus) filtering if specified.
      if (topP && topP < 1) {
        candidates.sort((a, b) => b.prob - a.prob);
        let cumProb = 0, nucleus = [];
        for (let cand of candidates) {
          cumProb += cand.prob;
          nucleus.push(cand);
          if (cumProb >= topP) break;
        }
        sumProb = nucleus.reduce((s, c) => s + c.prob, 0);
        candidates = nucleus.map(c => ({ word: c.word, prob: c.prob / sumProb }));
      }

      // Extend the current beam with each candidate.
      for (let cand of candidates) {
        newBeams.push({
          sequence: [...seq, cand.word],
          prob: beam.prob * cand.prob
        });
      }
    }
    // Keep only the top beams (by cumulative probability).
    newBeams.sort((a, b) => b.prob - a.prob);
    beams = newBeams.slice(0, beamWidth);
    if (newBeams.length === 0) break;
  }

  // Return the sequence of the highest-probability beam.
  return beams.length ? beams[0].sequence.join(" ") : "";
}

// --- Example Usage ---
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";
const models = trainModels(trainingText);
const generatedText = generateTextBeamSearch(models, "The dog", 30, {
  beamWidth: 3,
  temperature: 0.8,
  topK: 5,
  topP: 0.9,
  lambdas: { unigram: 0.2, bigram: 0.3, trigram: 0.5 }
});
console.log(generatedText);
