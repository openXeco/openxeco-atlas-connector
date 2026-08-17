/**
 * JRC Cybersecurity Taxonomy - Knowledge Domains hierarchy
 *
 * The ATLAS API returns all cluster_thematic_area terms flat without parent relationships.
 * This file provides the hardcoded mapping from sub-domain ATLAS UUIDs to their parent domain UUIDs,
 * derived from the parent domain descriptions which explicitly list their sub-domains.
 *
 * Source: ATLAS API taxonomy_term/cluster_thematic_area descriptions
 */

/**
 * Maps sub-domain ATLAS UUID → parent domain ATLAS UUID.
 * Only sub-domains are listed; parent domains are NOT in this map.
 */
export const KNOWLEDGE_DOMAIN_HIERARCHY: Record<string, string> = {
  // --- Assurance, Audit, and Certification (f05e6b27-77b6-4c97-aed8-747b1d5f934f) ---
  '88ecda0c-9d93-4ba7-9752-4d8549a4b12f': 'f05e6b27-77b6-4c97-aed8-747b1d5f934f', // Assessment
  '852d6fc6-35cb-40c3-9d34-ea030b4c43d8': 'f05e6b27-77b6-4c97-aed8-747b1d5f934f', // Assurance
  'd74c476a-dfff-487b-84e2-ecc9453765c9': 'f05e6b27-77b6-4c97-aed8-747b1d5f934f', // Audit
  'c674019a-9067-406e-b861-6af73089e1f6': 'f05e6b27-77b6-4c97-aed8-747b1d5f934f', // Certification

  // --- Cryptology (Cryptography and Cryptanalysis) (81419fc1-aed8-4d08-8665-98f8c0df0438) ---
  '4f716bc8-b31a-451b-b3bc-6d5a9a13de65': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Asymmetric cryptography
  '1a1036eb-4598-484e-b9b7-a5d63d184590': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Cryptanalysis methodologies, techniques and tools
  '68ea80c3-c0a7-4924-9d3f-b4ba34d55a75': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Crypto material management (e.g. key management, PKI)
  'b54f631f-5bc9-466a-869c-f8174a7d3046': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Digital signatures
  '16e58535-ff85-4eca-a4d1-3cdc2cfe73e1': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Functional encryption
  'f4df8a87-155e-4c04-bed2-c6b68faac03c': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Hash functions
  '7aaf3774-a6ac-4894-92bd-dfdcc09180e4': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Homomorphic encryption
  '61a08998-00b5-4af2-8a0d-1b22dad78b9c': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Mathematical foundations of cryptography
  '730c38a2-0181-4e1e-bc12-8d250f6e367e': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Message authentication
  '7b33a495-2210-4f7f-abe8-a311cda894db': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Post-quantum cryptography
  '1fc2e9d3-8fbe-4a41-a75f-22bae1e9a2ce': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Quantum cryptography
  '015c5007-9a00-403a-8e54-b27df39f1713': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Random number generation
  'c1835905-6297-4ed7-895d-2e619897223c': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Secure multi-party computation
  '1dc1927d-e0c0-4470-9314-7d10b2c234b6': '81419fc1-aed8-4d08-8665-98f8c0df0438', // Symmetric cryptography

  // --- Data Security and Privacy (f88f09ca-d30d-4cd3-a81a-d3a899f55662) ---
  '35e454a2-2ca3-49ba-8fa2-7a61d781d801': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Anonymity, pseudonymity, unlinkability, undetectability, or unobservability
  '16a17fe4-72ce-4a66-ae01-021c84984d14': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Data integrity
  '8364bf7e-2e95-4f39-8fde-ddc92023408d': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Data usage control
  '8d560601-e040-4b6e-b076-46c85799323c': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Design, implementation, and operation of data management systems that include security and privacy functions
  '5b8d6a25-10c2-4ae9-b2f6-b79516bca9a3': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Digital Rights Management (DRM)
  '33010c9c-42e9-481d-a240-edc8b1ce32d7': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Eavesdropping techniques (e.g. via electromagnetic radiation, visual observation of blinking LEDs, acoustic via keyboard typing noise)
  '4b9e5b40-2b85-46cf-ac6d-97c718641fa4': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Privacy Enhancing Technologies (PET)
  'd5c9b799-1092-4823-bd6f-cb8fa72dca3b': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Privacy requirements for data management systems
  '4a72d717-8bd5-4676-8dce-db666d093d25': 'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Risk analysis and attacks with respect to de-anonymization or data re-identification (e.g. inference attack)

  // --- Education and Training (35f781fa-6916-4e13-b484-ebb9019bb9dd) ---
  'd9e0b9e5-a76e-4e4b-a050-534b722bb44e': '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Cyber ranges, Capture the Flag exercises, simulation platforms, educational/training tools, cybersecurity awareness
  'd7a593f5-59bf-4dbf-980d-7e71de8c0480': '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Cybersecurity-aware culture (e.g. including children education)
  'c453c264-5d0d-4e6a-9efe-792e001a943b': '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Education methodology
  '0a87b632-f269-4d4e-9d19-06fc2241fbcc': '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Higher education
  '6a175eb6-87d9-410f-bb42-100920ce3623': '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Professional training
  '96210eeb-3271-4469-8744-eeebde02d2ef': '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Vocational training

  // --- Human aspects (280a043d-5d19-4d6f-b2ad-700196cd601f) ---
  'ed111db1-8b0e-4775-b40e-ba76e1fdb779': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Accessibility
  '4b985e57-7155-441e-b245-24db7f2936c1': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Automating security functionality
  '603bc115-87a2-48ac-9bbf-22977a7456b8': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Computer ethics and security
  'c54ebee4-de63-4cc9-bf0b-c2f0fdb927a3': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Cyberpsychology
  '7bc9c338-c7e6-4f66-86f8-d30a803a4b70': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Cybersecurity profiling
  '031138b2-bb4f-4bce-954b-a999ea37828b': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Enhancing risk perception
  '2fd1ab71-5019-497a-b9e0-c23a2b2da872': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Forensic cyberpsychology
  '4a070bd7-2604-4e01-aa36-f3bd83460789': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Gamification
  '9f73ff69-1864-40d3-bd18-95dffff3ec73': '280a043d-5d19-4d6f-b2ad-700196cd601f', // History of cybersecurity
  '3c6263e4-9189-4466-8f64-d4ec00107397': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Human aspects of trust
  '13ebff58-05e0-44ce-82a5-a4377ff89e5c': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Human perception of cybersecurity
  'c5c2782c-5254-473d-81e0-9007809f1f4b': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Human-related risks/threats (social engineering, insider misuse, etc.)
  '08cec843-209f-4c52-b815-b9015434366c': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Non-intrusive security
  '4ef72180-8eca-46c0-b7a0-95ac19b9694f': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Privacy concerns, behaviours, and practices
  'ca348859-0d68-48c3-8007-aff84ac52665': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Psychological models and cognitive processes
  'fbedf6a9-882e-4260-b2f9-9efa84de9c8f': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Security visualization
  '4d732cbf-2b84-4ff9-9ed3-f1fcbfdb7d0b': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Socio-technical security
  '5551c210-7ae3-477a-8afc-a0b1a2d1e7fb': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Transparent security
  '0fe13adf-0503-4568-8a59-b1cf1f13f89f': '280a043d-5d19-4d6f-b2ad-700196cd601f', // Usability
  '1ca0f123-e803-4c95-8f70-267577c65c1e': '280a043d-5d19-4d6f-b2ad-700196cd601f', // User acceptance of security policies and technologies

  // --- Identity Management (715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1) ---
  '0c582a32-fb28-4303-a2f0-2e30debc7134': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Biometric methods, technologies and tools
  'a3114290-fa2a-4db5-9f22-39ca703c5197': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Identity and attribute management models, frameworks, applications, technologies, and tools (e.g. PKI, RFID, SSO, attribute-based credentials, federated IdM)
  '65aad757-373b-4009-a554-a359d5d050d4': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Identity management quality assurance
  '7e3efc67-e439-441f-b6a7-7858d2060054': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Legal aspects of identity management
  'c281cb10-d641-44f5-915d-4bbdab486d22': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Optical and electronic document security
  '77e7a99b-507d-4f6e-b058-3e09c3b5ac4c': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Privacy and identity management (e.g. privacy-preserving authentication)
  'c06d9fd1-5014-482d-8179-47247d4bc797': '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Protocols and frameworks for authentication, authorization, and rights management

  // --- Incident Handling and Digital Forensics (c2c37b83-15e5-47f0-a9f4-d5196b06ee8b) ---
  'c66b6f20-5382-4972-8e98-d3578cca917b': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Anti-forensics and malware analytics
  'af923308-b02d-4b1f-b631-668ca00459b1': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Citizen cooperation and reporting
  'cbed0786-22fe-474b-aff3-597f9e212b5e': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Coordination and information sharing in the context of cross-border/organizational incidents
  '00a1d269-caca-410f-b2cb-5d4f34fe6c0f': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Digital forensic case studies
  '946e0a27-1daf-4d9e-b9d1-aa47e83f90e9': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Digital forensic processes and workflow models
  '1aea7e06-f2b2-4b08-8978-a8e830db74c2': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Incident analysis, communication, documentation, forecasting (intelligence based), response, and reporting
  '1c1d247f-8cac-4053-b6f9-82541cb0b58c': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Policy issues related to digital forensics
  '10db0c02-0df1-40bd-a367-1689dadc6131': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Resilience aspects
  '0dae110f-cce8-4a08-afcf-c9ec21454ae7': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Theories, techniques and tools for the identification, collection, attribution, acquisition, analysis and preservation of digital evidence
  '28c0f783-666e-4901-af58-0b27853e6acb': 'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Vulnerability analysis and response

  // --- Legal aspects (f62609d8-3d14-44ad-86c7-610fce7cf69b) ---
  'b38fa0e0-cf35-432d-a4e3-a963629a3b34': 'f62609d8-3d14-44ad-86c7-610fce7cf69b', // Cybercrime prosecution and law enforcement
  'dee38f54-e884-4428-b08d-2d5a845c9c34': 'f62609d8-3d14-44ad-86c7-610fce7cf69b', // Cybersecurity regulation analysis and design
  '7e32245c-b747-4c22-9889-f2a5aa1d4e92': 'f62609d8-3d14-44ad-86c7-610fce7cf69b', // Intellectual property rights
  'e005ded4-533d-4acc-b1d0-7dff6da4d635': 'f62609d8-3d14-44ad-86c7-610fce7cf69b', // Investigations of computer crime (cybercrime) and security violations
  'ea258fc1-1855-4203-a15b-b40ba8ca271f': 'f62609d8-3d14-44ad-86c7-610fce7cf69b', // Legal and societal issues in information security (e.g. identity management, digital forensics, cybersecurity litigation)

  // --- Network and Distributed Systems (cb5ba234-3013-4158-8ae0-8e139038ce3c) ---
  '3012379b-b7d8-4c08-a49d-733b67b0890c': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Distributed consensus techniques
  'b6185db8-5304-465f-94f6-ca69f46807a4': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Distributed systems security
  '17227c41-db79-4861-80cf-a0b016845167': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Distributed systems security analysis and simulation
  'e2cf41a3-2bd7-4e2c-bc9b-17ab56f4950e': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Fault tolerant models
  '0605e1b8-cdc4-42b8-b967-b82c049bafd0': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Managerial, procedural and technical aspects of network security
  'ef8c85bf-882b-42e5-815e-e26e4db8e3c4': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Network attack propagation analysis
  'c4e6fcff-8473-4e5b-a56c-75c49d67173d': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Network interoperability
  '75d6fe80-393d-4bf2-aa8a-6970a2d1ddae': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Network layer attacks and mitigation techniques
  '2a0aa604-8aca-412e-9d9f-eceb5c12f7f4': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Network security (principles, methods, protocols, algorithms and technologies)
  '2b9ea54f-f4aa-4199-b149-173e70f8773f': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Network steganography
  '63080044-873d-4179-97fb-7cbae558579d': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Privacy-friendly communication architectures and services (e.g. Mix-networks, broadcast protocols, and anonymous communication)
  '17293ca1-8488-4271-83fc-fb5de6d38abd': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Protocols and frameworks for secure distributed computing
  'fc606175-d551-4629-ae60-2e0c849def53': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Requirements for network security
  'beeb255d-4225-4c1b-b833-a420ca5b8cf7': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Secure distributed computations
  'ec3be872-af93-4f30-a03c-06a018c88590': 'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Secure system interconnection

  // --- Security Management and Governance (5e48b522-dbb3-4439-b1a6-f4e2429585eb) ---
  '47d7707f-d473-457f-828c-c08c94fb785c': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Assessment of information security effectiveness and degrees of control
  '5654b3f4-e818-4d40-bcef-fb90bb454608': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Attack modelling, techniques, and countermeasures (e.g. adversary machine learning)
  'c1027b87-b3f2-4e46-bc56-ed3b905a7586': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Capability maturity models (e.g. assessment of capacities and capabilities)
  '895fae97-d9f9-4595-b963-1f64da195d6b': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Compliance with information security and privacy policies, procedures, and regulations
  'b7f11786-c282-4190-b6e1-6b26419a7d3e': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Economic aspects of the cybersecurity ecosystem
  'be511b76-484d-44e7-bed8-e1c7f80d7478': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Governance aspects of incident management, disaster recovery, business continuity
  'e0a5c851-5d80-414f-9cda-79744c5b7d81': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Identification of the impact of hardware and software changes on the management of Information Security
  '0111fc54-a2a9-46b8-a876-ee313f7d2f2b': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Managerial aspects concerning information security
  '81d46771-aa72-4c41-a04a-1566d224ba8d': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Modelling of cross-sectoral interdependencies and cascading effects
  '0c733eed-2b24-4aa0-8604-721a3e84de0f': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Privacy impact assessment and risk management
  '4fd9e0d3-7faa-4c49-849d-09b772e9a4f4': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Processes and procedures to ensure device end-of-life security and privacy (e.g. IT waste management and recycling)
  '25ce3558-10c4-4402-ad43-db8a1bc59787': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Risk management, including modeling, assessment, analysis and mitigation
  '57c8362c-df2e-4690-9dc4-0716f615dd48': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Standards for Information Security
  'df93cd28-3d09-43b8-8d54-d0e1b3937d58': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Techniques to ensure business continuity/disaster recovery
  'dabc2f3c-0edf-4012-aa24-293a236be71a': '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Threats and vulnerabilities modelling

  // --- Security Measurements (3d97645a-e7ba-4930-b008-8cce6ac04869) ---
  '6a3d2ae4-f03f-45d8-99e8-f7c56d7c4e87': '3d97645a-e7ba-4930-b008-8cce6ac04869', // Measurement and assessment of security levels
  '0b93f424-a174-444a-bb85-a15bf0edacc1': '3d97645a-e7ba-4930-b008-8cce6ac04869', // Security analytics and visualization
  '2d901f7c-87be-4e60-aa02-8d4ddce622c1': '3d97645a-e7ba-4930-b008-8cce6ac04869', // Security metrics, key performance indicators, and benchmarks
  '9d0508be-ee75-4317-9ebc-31aedb5ec0f3': '3d97645a-e7ba-4930-b008-8cce6ac04869', // Validation and comparison frameworks for security metrics

  // --- Software and Hardware Security Engineering (d804c494-ea80-436a-8ecc-ba927a0787e1) ---
  '00429a8c-5978-425e-a8fc-e57274d8c3d6': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Attack techniques (e.g. side channel attacks, power attacks, stealth attacks, advanced persistent attacks, rowhammer attacks)
  'c8ed70b7-30c5-4bca-ac04-d695110a1806': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Cybersecurity and cyber-safety co-engineering
  '14738909-9778-4386-8c8b-7bede33d9686': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Fault injection testing and analysis
  '91cbb53e-3fbe-4522-bdb6-cbf859cdc557': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Intrusion detection and honeypots
  '2452b71e-2d22-40d2-b5c2-de97eaab5e6f': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Malware analysis including adversarial learning of malware
  'b39f2aa5-d60f-4cff-bd08-52a9c9e17041': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Model-driven security and domain-specific modelling languages
  'ae9c2749-67bc-4453-9e98-bde744350e76': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Privacy by design
  '0533fe91-6414-4455-8f5f-6e6d4b0a7d84': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Quantitative security for assurance
  'ee6c1ce1-d8a8-450c-8b1a-598aec046ef8': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Refinement and verification of security management policy models
  'ac7508a7-60a2-4cc0-8bfd-cc93ed6bd90c': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Runtime security verification and enforcement
  'df73e5b7-e5de-40f7-a121-baf27edb6d48': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Secure programming principles and best practices
  '92df5544-7c60-4464-b3ce-0bf4b7364b9a': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Secure software architectures and design (security by design)
  'aff85818-b46b-45fe-9b3f-70f8715f1fb3': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Security and risk analysis of components compositions
  '78600f34-be21-429e-b8be-a978fe3b6666': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Security design patterns
  '3c93a80b-e3a5-4b8f-807b-54d864c800a7': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Security documentation
  '3b217d6e-3606-4f77-a85a-eb4eca18ad5f': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Security requirements engineering with emphasis on identity, privacy, accountability, and trust
  '0a2cf1a9-5ecc-4742-bead-0843922d6119': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Security support in programming environments
  '4bd8a674-1214-4bc6-8f88-6f8b7829562d': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Security testing and validation
  '7f3502d9-b867-4713-9002-58a735a4049e': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Self-* including self-healing, self-protecting, self-configuration systems
  'affb9d78-c7b6-4970-b622-45b302bdf1d0': 'd804c494-ea80-436a-8ecc-ba927a0787e1', // Vulnerability discovery and penetration testing

  // --- Steganography, Steganalysis and Watermarking (15ac16f3-68b6-450f-b593-aede52fd155b) ---
  '24b21108-7345-4243-a7e5-e5619f92766c': '15ac16f3-68b6-450f-b593-aede52fd155b', // Digital watermarking
  '159b76c1-4f7f-40e8-9954-d4728430e4e0': '15ac16f3-68b6-450f-b593-aede52fd155b', // Steganalysis
  '140ceee4-2e3c-4c51-9f06-c941308777b7': '15ac16f3-68b6-450f-b593-aede52fd155b', // Steganography

  // --- Theoretical Foundations (f4ececb0-f699-4402-b9ba-6d55793ddd2b) ---
  'e4678726-c5b9-4aed-97f3-f35c5edf283d': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Cybersecurity concepts, definitions, ontologies, taxonomies, foundational aspects
  'adaf8ff0-250b-41a4-b1fa-be301da891c8': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Cybersecurity uncertainty models
  '49e9ce0f-9069-4405-b49e-0b0d6ee63906': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Formal specification of various aspects of security (e.g properties, threat models, etc.)
  'ecc3d47b-878c-4d4e-b5b8-dd3309098402': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Formal specification, analysis, and verification of software and hardware
  '23eef45d-0d1a-4cef-a60d-94c3a1c1057a': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Formal verification of security assurance
  '96cf597e-02f5-46bf-93eb-0629195c79ab': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Information flow modelling and its application to confidentiality policies, composition of systems, and covert channel analysis
  '47a73093-ebb3-4487-a778-a6e439bbb1b9': 'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // New theoretically-based techniques for the formal analysis and design of cryptographic protocols and their applications

  // --- Trust Management and Accountability (888a384b-cdb6-4964-81dd-11b785ac0aa4) ---
  '060b1c5e-44b9-4611-a99c-8a7a1e471353': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Algorithmic auditability and accountability (e.g. explainable AI)
  'cdb65dcc-e02b-4191-95c8-0cd9aec38165': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Identity and trust management
  'a045d9b9-a537-4d0a-a22c-6b8f7d56abf9': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Reputation models
  '1ff59e35-4f5d-4c5c-aaa1-6c38b30fb536': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Semantics and models for security, accountability, privacy, and trust
  '340f6e9b-24b8-4b0a-be3c-ca9361305dd3': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Social aspects of trust
  '9dcfce33-082b-40f8-a17f-0caeb603d5e4': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trust and privacy
  '283ecc2b-7ea5-442f-803c-50caa2947e65': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trust and reputation of social and mainstream media
  'b7ca633f-6a20-47d0-be60-0d8a97c5288b': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trust in decision making algorithms
  'fb1a5487-59bf-4057-9b60-f6f7fd98c791': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trust in securing digital as well as physical assets
  '44b06ae5-118c-4862-a5f3-b61015d0ab8f': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trust management architectures, mechanisms and policies
  '81ca6640-56ff-4b17-a62a-ff688b90d567': '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trusted computing
} as const

/** Set of parent domain ATLAS UUIDs (the 15 top-level knowledge domains) */
export const KNOWLEDGE_DOMAIN_PARENT_IDS = new Set([
  'f05e6b27-77b6-4c97-aed8-747b1d5f934f', // Assurance, Audit, and Certification
  '81419fc1-aed8-4d08-8665-98f8c0df0438', // Cryptology (Cryptography and Cryptanalysis)
  'f88f09ca-d30d-4cd3-a81a-d3a899f55662', // Data Security and Privacy
  '35f781fa-6916-4e13-b484-ebb9019bb9dd', // Education and Training
  '280a043d-5d19-4d6f-b2ad-700196cd601f', // Human aspects
  '715bb49c-ba41-4b32-8d0e-6d8aaaae1fd1', // Identity Management
  'c2c37b83-15e5-47f0-a9f4-d5196b06ee8b', // Incident Handling and Digital Forensics
  'f62609d8-3d14-44ad-86c7-610fce7cf69b', // Legal aspects
  'cb5ba234-3013-4158-8ae0-8e139038ce3c', // Network and Distributed Systems
  '5e48b522-dbb3-4439-b1a6-f4e2429585eb', // Security Management and Governance
  '3d97645a-e7ba-4930-b008-8cce6ac04869', // Security Measurements
  'd804c494-ea80-436a-8ecc-ba927a0787e1', // Software and Hardware Security Engineering
  '15ac16f3-68b6-450f-b593-aede52fd155b', // Steganography, Steganalysis and Watermarking
  'f4ececb0-f699-4402-b9ba-6d55793ddd2b', // Theoretical Foundations
  '888a384b-cdb6-4964-81dd-11b785ac0aa4', // Trust Management and Accountability
])
