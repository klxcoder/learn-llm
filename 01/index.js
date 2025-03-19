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

// --- Advanced Beam Search with Log-Probabilities, Length Normalization, and Penalties ---
function generateTextAdvancedBeamSearch(models, startWords, numWords = 50, options = {}) {
  const {
    beamWidth = 3,
    diversityAlpha = 0.5,      // Diversity penalty: discourages same continuations across beams.
    repetitionPenalty = 0.1,   // Penalty per occurrence of a candidate in the beam.
    temperature = 1,           // Temperature scaling (applied in log space).
    topK = null,               // Optional: restrict candidates to topK.
    topP = null,               // Optional: nucleus filtering (topP cumulative probability).
    // Lambda weights for trigram, bigram, and unigram interpolation.
    lambdas = { unigram: 0.2, bigram: 0.3, trigram: 0.5 },
    lengthNormalization = true // Normalize cumulative log score by sequence length.
  } = options;

  const vocabulary = Object.keys(models.unigrams);
  const totalUnigrams = Object.values(models.unigrams).reduce((a, b) => a + b, 0);

  // Initialize beams with starting words and a cumulative log-probability score (0 = log(1)).
  let beams = [{ sequence: startWords.split(" "), score: 0 }];

  while (beams.length && beams[0].sequence.length < numWords) {
    let newBeams = [];
    // Gather last words of current beams for diversity penalty.
    const lastWords = beams.map(b => b.sequence[b.sequence.length - 1]);

    for (let beam of beams) {
      const seq = beam.sequence;
      const lastWord = seq[seq.length - 1];
      const trigramContext = seq.length >= 2 ? seq.slice(-2).join(" ") : null;

      let candidates = [];
      // For each candidate in the vocabulary, compute an interpolated probability.
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
        let pCombined = lambdas.trigram * pTri + lambdas.bigram * pBi + lambdas.unigram * pUni;
        if (pCombined <= 0) continue;

        // Compute log-probability (with temperature scaling).
        let logProb = Math.log(pCombined) / temperature;

        // Apply repetition penalty if 'word' appears already in the sequence.
        const repCount = seq.filter(w => w === word).length;
        logProb -= repetitionPenalty * repCount;

        // Apply diversity penalty based on how many beams end with this word.
        const diversityCount = lastWords.filter(w => w === word).length;
        logProb -= diversityAlpha * diversityCount;

        candidates.push({ word, logProb });
      }

      // Sort candidates by logProb (higher is better).
      candidates.sort((a, b) => b.logProb - a.logProb);

      // Apply topK filtering if specified.
      if (topK && candidates.length > topK) {
        candidates = candidates.slice(0, topK);
      }

      // Apply topP (nucleus) filtering if specified.
      if (topP && topP < 1) {
        let cumulative = 0;
        const expCandidates = candidates.map(c => ({ word: c.word, prob: Math.exp(c.logProb) }));
        const sumExp = expCandidates.reduce((s, c) => s + c.prob, 0);
        expCandidates.forEach(c => c.prob /= sumExp);
        let filteredWords = [];
        for (let c of expCandidates) {
          cumulative += c.prob;
          filteredWords.push(c.word);
          if (cumulative >= topP) break;
        }
        candidates = candidates.filter(c => filteredWords.includes(c.word));
      }

      // Extend the current beam with each candidate.
      for (let cand of candidates) {
        const newSeq = seq.concat(cand.word);
        let newScore = beam.score + cand.logProb;
        if (lengthNormalization) {
          newScore = newScore / newSeq.length;
        }
        newBeams.push({ sequence: newSeq, score: newScore });
      }
    }
    // Keep only the top beams.
    newBeams.sort((a, b) => b.score - a.score);
    beams = newBeams.slice(0, beamWidth);
  }

  return beams.length ? beams[0].sequence.join(" ") : "";
}

// --- Example Usage ---
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";
const models = trainModels(trainingText);

const generatedText = generateTextAdvancedBeamSearch(models, "The dog", 30, {
  beamWidth: 3,
  diversityAlpha: 0.5,
  repetitionPenalty: 0.1,
  temperature: 0.8,
  topK: 5,
  topP: 0.9,
  lambdas: { unigram: 0.2, bigram: 0.3, trigram: 0.5 },
  lengthNormalization: true
});
console.log(generatedText);
