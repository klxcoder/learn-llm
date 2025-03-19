with open('input.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print("length of dataset in characters: ", len(text)) # 1115394

# let's look at the first 100 characters
print(text[:100])

s = set(text)

print(s)

chars = sorted(s)

print(chars)

vocab_size = len(chars)

print(vocab_size) # 65

stoi = { ch:i for i,ch in enumerate(chars) }

print(stoi)

itos = { i:ch for i,ch in enumerate(chars) }

print(itos)