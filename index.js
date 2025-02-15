// Train models for unigrams, bigrams, and trigrams.
function trainModels(text) {
  const words = text.split(/\s+/);
  const unigrams = {}, bigrams = {}, trigrams = {};
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    unigrams[word] = (unigrams[word] || 0) + 1;
    if (i < words.length - 1) {
      const next = words[i + 1];
      bigrams[word] = bigrams[word] || {};
      bigrams[word][next] = (bigrams[word][next] || 0) + 1;
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

// Advanced weighted choice with temperature, topK, and nucleus (top-p) sampling.
function weightedRandomChoice(freqMap, temperature = 1, topK = null, topP = null) {
  let entries = Object.entries(freqMap).map(([word, count]) => ({
    word,
    adjusted: Math.pow(count, 1 / temperature)
  }));

  // Apply topK filtering if provided.
  if (topK && topK < entries.length) {
    entries.sort((a, b) => b.adjusted - a.adjusted);
    entries = entries.slice(0, topK);
  }

  // Convert adjusted counts to probabilities.
  const total = entries.reduce((sum, e) => sum + e.adjusted, 0);
  entries = entries.map(e => ({ word: e.word, prob: e.adjusted / total }));

  // Apply top-p (nucleus) sampling if provided.
  if (topP && topP < 1) {
    entries.sort((a, b) => b.prob - a.prob);
    let cumulative = 0, nucleus = [];
    for (const e of entries) {
      cumulative += e.prob;
      nucleus.push(e);
      if (cumulative >= topP) break;
    }
    const nucleusTotal = nucleus.reduce((sum, e) => sum + e.prob, 0);
    entries = nucleus.map(e => ({ word: e.word, prob: e.prob / nucleusTotal }));
  }

  // Sample from the final probability distribution.
  let rand = Math.random();
  for (const e of entries) {
    rand -= e.prob;
    if (rand < 0) return e.word;
  }
  return entries[entries.length - 1].word;
}

// Generate text with backoff: trigram → bigram → unigram.
function generateText(models, startWords, numWords = 50, options = {}) {
  const { temperature = 1, topK = null, topP = null } = options;
  const words = startWords.split(" ");
  while (words.length < numWords) {
    let nextWord = null;
    if (words.length >= 2) {
      const key = words.slice(-2).join(" ");
      if (models.trigrams[key]) {
        nextWord = weightedRandomChoice(models.trigrams[key], temperature, topK, topP);
      }
    }
    if (!nextWord && words.length >= 1) {
      const last = words[words.length - 1];
      if (models.bigrams[last]) {
        nextWord = weightedRandomChoice(models.bigrams[last], temperature, topK, topP);
      }
    }
    if (!nextWord) {
      nextWord = weightedRandomChoice(models.unigrams, temperature, topK, topP);
    }
    words.push(nextWord);
  }
  return words.join(" ");
}

// Example training text.
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";

const models = trainModels(trainingText);
const generated = generateText(models, "The dog", 30, { temperature: 0.8, topK: 3, topP: 0.9 });
console.log(generated);

/*
  + Temperature: Scales the probability distribution; lower values make choices more deterministic, higher values increase randomness.
  + TopK: Restricts the choices to the K most likely words.
  + TopP: Includes the smallest set of words whose cumulative probability reaches a threshold p.
*/