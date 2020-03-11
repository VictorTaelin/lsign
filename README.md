Simple, fast, quantum-proof, 768-bit signatures
===============================================

Introduction
------------

Hash-based signature schemes have received recent attention
for being quantum-proof. Unfortunatelly, most existing
schemes have keys too big to be practical. I'll describe a
(retrospectively obvious) modification of Lamport's scheme
that features 256-bit public keys, 768-bit signatures, and
fast (almost instant) signing and verification time. It is
stateful for both the signer and verifier, but you can't
leak your private key by reuse. It is also very simple: this
implementation is around 100 lines of code. It has one huge
caveat, though: it can only sign 1-bit messages. This may
sound useless, but it can actually be very efficient in a
blockchain context with optimized payloads.

Consider, for example, a decentralized currency. If we
optimize the payload by 1. storing a list of 16 favorite
contacts (say, stores) and products (up to 16), then we
could make a payment with as few as 8 "useful bits". This
results in a 768-byte transaction, which is just 2x the
average Bitcoin transaction size, yet orders of magnitude
faster and quantum proof. That corresponds to 9% of the size
of a Lamport signature. Even with a 64-bit address and
amount payload, it'd still be smaller. In a way, it can be
seen as a streamed version of Lamport's scheme, optimized
to sign very, very small messages.

API
---

Install with `npm i qsign` and import with `require("qsign")`.

```javascript
// Generates a random 256-bit private key (TODO: use crypto random)
qsign.pvt();

// Generates a 256-bit public key from private key (this is slow)
qsign.pub(pvt);

// Signs the nth message as `bit` (average 768-bit signature)
qsign.sgn(pvt, nth, bit);

// Returns the bit signed, if signature is valid
qsign.chk(pub, sign);
```

How it works?
-------------

The idea is stupidly simple: the signer generates a merkle
tree of 2^24 random 256-bit elements. The merkle root is
his/her public key. To "sign" the `n`th bit, he/she
broadcasts the merkle proof the element of index `2n + bit`.
The verifier then checks if the proof holds. If so, then it
knows the `floor(n/2)`th bit signed is `n mod 2`. In other
words, to sign a bit, you simply reveal a number of your
random set. If its index is even, you signed `1`; otherwise,
you signed `0`. **That's all.**

For example, suppose you want to send signed messages to a
verifier. First, you generate a set of 2^24 random 256-bit
numbers (ex: `set : Array(2**24) = [56812, 13069, 160899,
10505...]`). Then, you compute the merkle root of this set:
that is you public key. Then, to sign the `bits =
[10110001]` message, you send the merkle proofs of
`set[2*n+bit[n]]`, that is, `set[0+1], set[2+0], set[4+1],
set[6+1], set[8+0], set[10+0], set[12+0], set[14+1]`. The
verifier checks if they are correct. If so, that means you
signed the `bits[n]` bits, i.e., `10110001`.

This scheme has a limit of 2^24 messages. You could
increase it as much as needed, but the time to generate an
address (which requires building set of 2^N numbers and
compute its merkle root) would rise proportionally.

Why are signatures small?
-------------------------

There are 3 reasons. The first one is that we can sign
messages smaller than 256 bits. The reason Lamport
signatures are big is that you need to sign all the 256 bits
of the message's hash. That requires a lot of hashes. But in
blockchains, sometimes transactions can have much less than
256 bits of "useful information". For example, some Ethereum
transactions just call a contract function with no
arguments.

The second one is that, since the verifier is stateful, it
can store our merkle tree. This allows us to avoid sending
branches that are already known. This is a huge
optimization. If we sent the entire merkle path for every
bit we signed, we'd need 24 hashes, or 768 bytes, per signed
bit. If we memoize past merkle proofs, the first bit signed
still needs 24 hashes, but the second one only needs 1,
averaging 768 bits of signature per bit signed.

The third is that both the payload and the sender address
are recoverable from the signature, so you don't need to
send them separately.

In short, the main catch is that LSign doesn't hash the
message before signing, assuming it is smaller than a hash.
This allows us to perform very cheap signatures in cases
where the payloads are minuscle (say, 1-16 bits). This
increases linearly, reaching parity with Lamport signatures
on payloads larger than 86 bits.

Disclaimer
----------

This algorithm is so simple that I won't claim I've invented
it. In fact, it is probably so obvious that I'm embarrassed
by creating a repository for it. But I've never seen it
described before, and it can definitely be useful, if not
optimal, for some applications, so I thought I could write
about it anyway. If this is widely known, just let me know
so I'll just rename the repository.
