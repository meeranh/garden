# CI7100 Cryptography - Syllabus

## Part 0: Mathematical Prerequisites

### 0.1 Modular Arithmetic
- The mod operation
- Modular addition, subtraction, multiplication
- Modular inverse
- Relatively prime (coprime) numbers

### 0.2 Number Theory Essentials
- Prime numbers
- Greatest Common Divisor (GCD)
- Euclidean Algorithm
- Extended Euclidean Algorithm
- Euler's Totient Function φ(n)
- Fermat's Little Theorem

### 0.3 Binary Operations
- XOR operation
- Bit manipulation basics

---

## Part 1: Symmetric Cryptography

### 1.1 Fundamentals
- Symmetric vs asymmetric encryption
- Key distribution problem
- Confusion and diffusion principles

### 1.2 Data Encryption Standard (DES)
- History and development
- 64-bit block, 56-bit key
- Feistel network structure
- 16 rounds overview
- Key schedule
- DES weaknesses
- Triple DES (3DES)

### 1.3 Advanced Encryption Standard (AES)
- NIST standardization process (Rijndael)
- Block sizes: 128-bit block, 128/192/256-bit keys
- Number of rounds (10/12/14)
- Four operations:
  - SubBytes (S-box substitution)
  - ShiftRows
  - MixColumns
  - AddRoundKey
- Key expansion
- S-AES (Simplified AES)
- AES vs DES security comparison

### 1.4 Block Cipher Modes of Operation
- Electronic Codebook (ECB)
  - How it works
  - Pattern preservation weakness
- Cipher Block Chaining (CBC)
  - IV requirement
  - Error propagation
- Cipher Feedback Mode (CFB)
- Output Feedback Mode (OFB)
- Counter Mode (CTR)

### 1.5 Brute-Force Attack Calculations
- Key space calculations
- DES: 2^56 keys
- AES-128: 2^128 keys
- Time calculations given decryptions/second

---

## Part 2: Asymmetric (Public-Key) Cryptography

### 2.1 Public-Key Concepts
- Public key vs private key
- Key pairs
- Comparison with symmetric encryption
- Advantages and disadvantages

### 2.2 RSA Algorithm
- Mathematical foundations
  - Modular arithmetic
  - Euler's totient function
  - Modular inverse
- Key generation steps:
  1. Choose two large primes p, q
  2. Compute n = p × q
  3. Compute φ(n) = (p-1)(q-1)
  4. Choose e coprime to φ(n)
  5. Compute d = e^(-1) mod φ(n)
- Public key: (e, n)
- Private key: (d, n)
- Encryption: C = M^e mod n
- Decryption: M = C^d mod n
- Security basis: Integer factorization problem
- RSA for confidentiality
- RSA for authentication
- Combining confidentiality and authentication

### 2.3 Diffie-Hellman Key Exchange
- Historical context (1976)
- Key agreement vs key exchange
- Public parameters: prime p, generator g
- Protocol steps:
  1. Alice chooses private a, sends g^a mod p
  2. Bob chooses private b, sends g^b mod p
  3. Shared secret: K = g^(ab) mod p
- Security basis: Discrete Logarithm Problem
- Man-in-the-Middle (MITM) attack
  - How it works
  - Prevention methods

### 2.4 Elliptic Curve Cryptography (ECC)
- Elliptic curve equation: y² = x³ + ax + b
- Point addition
- Scalar multiplication
- Finite field arithmetic (mod p)
- Base point and large order
- ECDLP
- Key generation with ECC
- ECC vs RSA comparison
- ECDH
- ECDSA

### 2.5 Digital Signatures
- Concept and purpose
- Hash-then-sign paradigm
- RSA signatures
- DSA (Digital Signature Algorithm)
- Non-repudiation

---

## Part 3: Hash Functions & Data Integrity

### 3.1 Cryptographic Hash Functions
- Definition: one-way function
- Properties:
  - Pre-image resistance
  - Second pre-image resistance
  - Collision resistance

### 3.2 Hash Algorithms
- MD5 (128-bit, broken)
- SHA-1 (160-bit, deprecated)
- SHA-2 family (SHA-256, SHA-384, SHA-512)
- SHA-3 (Keccak, sponge construction)

### 3.3 Attacks on Hash Functions
- Brute-force attack
- Birthday attack
- Output length importance

### 3.4 Merkle Trees
- Structure
- Data integrity verification
- Applications

### 3.5 Message Authentication Codes (MACs)
- HMAC construction
- CBC-MAC

---

## Part 4: Cryptographic Protocols

### 4.1 Protocol Fundamentals
- Protocol characteristics
- Security requirements
- Session keys vs long-term keys

### 4.2 Key Agreement Protocols
- Diffie-Hellman
- Three-Pass Protocol (Shamir)
  - Commutative encryption
  - Protocol steps
  - Advantages and disadvantages
- Authenticated key exchange

### 4.3 Key Distribution & Management
- Key Distribution Center (KDC)
- Kerberos
- Public Key Infrastructure (PKI)
  - Certificate Authorities (CA)
  - Digital certificates
  - X.509 standard

### 4.4 Advanced Protocols
- Commitment schemes
  - Commit and reveal phases
  - Binding and hiding properties
- Blind signatures

---

## Part 5: Steganography & Secret Sharing

### 5.1 Steganography
- Definition: hiding information
- Steganography vs encryption
- Terminology:
  - Cover medium
  - Payload
  - Stego-object
  - Stego-key
- Security property: undetectability
- Text-based steganography
  - First-letter method
  - Null cipher
- Image-based steganography
  - LSB method
- Steganalysis
- Applications in social networks
- Socially constrained vs unconstrained channels

### 5.2 Secret Sharing
- Threshold schemes (t, n)
- Shamir's Secret Sharing Scheme
  - Polynomial interpolation
  - Share generation
  - Secret reconstruction
- Roles:
  - Dealer
  - Players
  - Combiner
- Applications:
  - Cloud security
  - Key escrow

---

## Part 6: Applications

### 6.1 PGP (Pretty Good Privacy)
- History and legal controversy
- PGP for confidentiality
  - Session key generation
  - Hybrid encryption
- PGP for authentication
  - Hash and sign
- PGP signed message format
- Key distribution methods
  - Manual
  - Email
  - Key servers
- Web of Trust model
- Reading key server output
  - Key ID
  - Signatures
  - Certifications

### 6.2 Web Security / SSL-TLS
- SSL/TLS overview
- Digital certificates
- Apache SSL configuration
  - SSLCertificateFile
  - SSLCertificateKeyFile
- HTTPS handshake

### 6.3 IoT Security
- IoT definition and examples
- Security challenges
- Vulnerabilities:
  - Increased attack surface
  - Proliferation of protocols
  - Lazy consumers
  - High demands on security controls
- Threats:
  - Loss of data ownership
  - Hype instead of ripe
  - High attack impact
  - Lack of standards
- Attack scenarios and impacts
- Security controls

### 6.4 Other Topics
- S/MIME
- Quantum cryptography
- Blockchain
- Anonymity and Tor
