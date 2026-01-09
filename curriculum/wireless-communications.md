# CI7150 Wireless Communications and Networks - Syllabus

---

## Part 1: RF Fundamentals and Link Budget

### 1.1 Antenna Fundamentals
- Antenna gain
- Directivity
- Relationship between gain and directivity

### 1.2 Propagation and Path Loss
- Free space path loss
- Two-ray ground model
- Path loss formula: Lp = 20log(4πd/λ) or Lp = 20log(4πdf/c)

### 1.3 Link Budget Calculations
- Friis transmission equation
- Received power: Pr(dBm) = Pt(dBm) + Gt(dB) + Gr(dB) - Lp(dB)
- Eb/No calculation: Eb/No = Pr - 10log(Rb) - 10log(kT)
- Noise power (kTB)
- Boltzmann's constant: k = 1.3803 × 10⁻²³ J/K

### 1.4 Unit Conversions
- dBm to Watts: P(W) = 10^((PdBm - 30)/10)
- dBW to dBm: PdBm = PdBW + 30
- Example: -72 dBm → 10^((-72-30)/10) = 10^(-10.2) W

### 1.5 Diversity Techniques
- Spatial diversity
- Frequency diversity
- Time diversity

---

## Part 2: Digital Modulation

### 2.1 Basic Digital Modulation
- ASK (Amplitude Shift Keying)
  - BASK waveform drawing for bit sequence
- FSK (Frequency Shift Keying)
  - BFSK waveform drawing for bit sequence
  - Advantages and disadvantages of FSK
- PSK (Phase Shift Keying)
  - BPSK
  - QPSK waveform drawing for bit sequence

### 2.2 QAM (Quadrature Amplitude Modulation)
- 16-QAM constellation diagram (4×4 grid)
- 64-QAM constellation diagram (8×8 grid)
- QAM modulator block diagram
- How QAM conserves bandwidth
- Bits per symbol: 16-QAM = 4 bits, 64-QAM = 6 bits

### 2.3 Signal Encoding Techniques
- Basic signal encoding techniques for digital transmission
- Characteristics of each technique

---

## Part 3: Multiple Access and Duplexing

### 3.1 Duplexing
- FDD (Frequency Division Duplex)
- TDD (Time Division Duplex)

### 3.2 FDMA
- Operation
- Channel allocation

### 3.3 TDMA
- Operation
- Frame structure
- Time slots

### 3.4 OFDM
- Principle of operation
- Subcarriers and orthogonality
- Cyclic prefix

### 3.5 OFDMA and SC-FDMA
- OFDMA operation
- SC-FDMA operation
- Why OFDMA for downlink (spectral efficiency)
- Why SC-FDMA for uplink (lower PAPR)
- Advantages and disadvantages of OFDM/OFDMA
- Transmitter and receiver architecture considerations

---

## Part 4: Error Control and Channel Coding

### 4.1 Error Control Schemes
- ARQ (Automatic Repeat Request)
- FEC (Forward Error Correction)
- Difference between ARQ and FEC with examples
- HARQ (Hybrid ARQ)
  - Types of HARQ process
  - Which HARQ type in LTE physical layer

### 4.2 Hamming Codes
- Calculating Hamming codeword for message
- For m data bits: r check bits where 2^r ≥ m + r + 1
- Check bits at positions 1, 2, 4, 8, ...
- Error correction using check bits
- Example: 11-bit message codeword calculation and correction

### 4.3 Convolutional Codes
- Generator polynomials (e.g., G0 = 1101, G1 = 1110)
- Code rate: R = 1/n (n = number of output bits per input bit)
- Constraint length: K = length of generator polynomial
- Number of states in state diagram: States = 2^(K-1)
- Comparison: which code gives lower BER and why (longer constraint = lower BER)

### 4.4 Block Codes vs Convolutional Codes
- Comparison
- Use in communication chain

---

## Part 5: MIMO and Advanced Antenna Systems

### 5.1 MIMO Concept
- What is MIMO
- Spatial multiplexing
- MIMO configurations (2x2, 4x4, 8x8)
- Impact on system capacity (multiplies throughput by min(Tx, Rx) antennas)

### 5.2 MIMO in Cellular Networks
- Where MIMO is used
- How MIMO is used in modern cellular networks

---

## Part 6: Wireless LANs (WiFi)

### 6.1 IEEE 802.11 Standards
- 802.11 a/b/g/n/ac overview
- Router setup steps (802.11g)

### 6.2 WiFi Security
- WEP
  - Operation
  - Weaknesses
- WPA
  - Operation
  - Limitations
- WPA2
  - Operation
  - Improvements over WPA
  - Limitations
- Comparison of WEP, WPA, WPA2

### 6.3 IEEE 802.11i
- Security mechanisms
- Four-way handshake

---

## Part 7: WiMAX (IEEE 802.16)

### 7.1 Physical Layer
- IEEE 802.16e PHY
- OFDMA-based PHY
- Diagrams

### 7.2 MAC Layer QoS Framework
- QoS framework description
- Why QoS is needed
- Service classes
- Diagrams

### 7.3 Scheduling
- Channel-aware schedulers
- Channel-unaware schedulers
- Differentiation between them
- Flow diagrams

---

## Part 8: Mobile Ad Hoc Networks (MANETs)

### 8.1 OLSR (Optimised Link State Routing)
- Protocol description
- Protocol diagram
- Deficiencies

### 8.2 OLSRv2
- Protocol description
- Protocol diagram
- Deficiencies

### 8.3 AODV (Ad-hoc On-Demand Distance Vector)
- Protocol description
- Route discovery and maintenance
- Protocol diagram
- Deficiencies

### 8.4 CML (ChaMeLeon) Protocol
- Protocol description
- Protocol diagram
- Main difference compared to OLSR and AODV

---

## Part 9: Cellular Concepts and GSM (2G)

### 9.1 Cellular Fundamentals
- Frequency reuse cluster definition
- Most important criterion for cluster size calculation
- Spectral efficiency: N vs M cluster comparison (N > M → M has higher efficiency)
- Co-channel interference

### 9.2 Evolution
- Major driving factors from 2G to 4G

### 9.3 GSM Air Interface Parameters
- TDMA and FDD
- 8 time slots per TDMA frame
- Full duplex carrier (uplink + downlink frequencies)
- Carrier bandwidth = 2×200 kHz

### 9.4 GSM Capacity Calculations
- Total carriers = Spectrum (MHz) / 0.2 MHz
- Carriers per cell = Total carriers / Cluster size
- Speech calls per cell = Carriers per cell × 8 (minus control channels)
- Example calculation:
  - Given: 2×7 MHz spectrum, 7-cell cluster
  - Carriers = 7 / 0.2 = 35
  - Carriers/cell = 35 / 7 = 5
  - Calls/cell = 5 × 8 = 40 (minus control)

---

## Part 10: LTE (4G)

### 10.1 LTE Architecture
- Data plane function
- Control plane function
- Network nodes:
  - User Equipment (UE)
  - Base Station (eNodeB)
  - S-GW (Serving Gateway)
  - P-GW (PDN Gateway)
  - MME (Mobility Management Entity)
  - HSS (Home Subscriber Server)
- Basic architecture diagram

### 10.2 LTE Frame Structure (3GPP Parameters)
- Type 1 frame (FDD)
- Radio frame = 10 subframes
- Subframe = 2 time-slots = 1 ms
- Time-slot = 0.5 ms
- Time-slot = 7 OFDM symbols (normal CP)
- Intercarrier spacing = 15 kHz
- Cyclic prefix (normal vs extended)
- Resource block = 12 subcarriers × 7 symbols

### 10.3 LTE Data Rate Calculations
- Modulation bits:
  - QPSK = 2 bits/symbol
  - 16QAM = 4 bits/symbol
  - 32QAM = 5 bits/symbol
  - 64QAM = 6 bits/symbol
- Resource blocks per bandwidth:
  - 10 MHz = 50 RBs
  - 20 MHz = 100 RBs
- Throughput calculation:
  - Symbols/second = RBs × 12 subcarriers × 7 symbols × 2 slots × 1000 subframes
  - Bits/second = Symbols × bits/symbol × coding rate × BW efficiency × MIMO layers
- Example: 20 MHz, 16QAM, 4×4 MIMO, 2/3 coding, 90% efficiency

### 10.4 LTE-Advanced: CoMP
- Coordinated Multi-Point concept
- Transmission and reception
- Diagram

### 10.5 LTE-Advanced: Carrier Aggregation
- Inter-band carrier aggregation
- Intra-band carrier aggregation
- Maximum achievable bandwidth = 5 × 20 MHz = 100 MHz
- Carrier aggregation in heterogeneous networks

### 10.6 Heterogeneous Networks
- Inter-technology HetNets
- Intra-technology HetNets
- Relay nodes
  - Types
  - Advantages in HetNets

### 10.7 VoLTE
- Why VoLTE is needed

---

## Part 11: 5G

### 11.1 5G Requirements
- ITU triangle diagram
- Three pillars:
  - eMBB (enhanced Mobile Broadband)
  - URLLC (Ultra-Reliable Low-Latency Communications)
  - mMTC (massive Machine-Type Communications)
- Detailed explanation of each pillar

### 11.2 5G Technologies
- mmWave band
  - Advantages
  - Challenges

### 11.3 D2D Networks
- Device-to-Device concept
- Classification of D2D networks

### 11.4 5G Applications
- Vertical markets
- Smart city design case study
  - How 5G enables smart city
  - Technical details and real facts

---

## Part 12: Mobility Management

### 12.1 Mobile IP Concepts
- Home Address (HA) vs Care of Address (CoA)
- Difference between HA and CoA

### 12.2 Mobile IPv4
- Home Agent role
- Foreign Agent role
- Diagram showing HA and FA
- How CN sends packets to MT
- Packet flow description

### 12.3 Mobile IPv6
- Operation
- Benefits compared to MIPv4
- Diagram

### 12.4 Advanced Mobile IP
- Hierarchical MIPv6 (HMIPv6)
- Fast MIPv6 (FMIPv6)
- Proxy MIPv6 (PMIPv6)
- Similarities between HMIPv6 and FMIPv6
- Differences between HMIPv6 and FMIPv6

### 12.5 IEEE 802.21 MIH
- MIH Function
- MIH services diagram
- Event services:
  - MIH_Link_Detected
  - MIH_Link_Up
  - MIH_Link_Down
  - MIH_Link_Parameters_Report
  - MIH_Link_Going_Down
- Command services:
  - MIH_Link_Get_Parameters
  - MIH_Link_Configure_Thresholds
  - MIH_Link_Actions
  - MIH_Net_HO_Candidate_Query
  - MIH_MN_HO_Candidate_Query
- Information services

---

## Part 13: Standards Organizations

### 13.1 IETF (Internet Engineering Task Force)
- Function
- Working groups (name three)

### 13.2 ITU (International Telecommunication Union)
- Function
- Sectors:
  - ITU-R
  - ITU-T
  - ITU-D

### 13.3 IEEE (Institute of Electrical and Electronics Engineers)
- Function
- Standards (name three)

---

## Part 14: Cloud Computing

### 14.1 Deployment Models
- Public cloud
- Private cloud
- Hybrid cloud
- Community cloud
- Based on location and distribution

### 14.2 Delivery Models
- IaaS (example: AWS EC2)
- PaaS (example: Google App Engine)
- SaaS (example: Microsoft 365)

### 14.3 Performance Metrics
- User-perceived metrics (three examples)
- Provider-centric metrics (three examples)
- Comparison

### 14.4 Emotion-Aware Mobile Cloud Computing
- Concept
- Applicability with paradigm example
