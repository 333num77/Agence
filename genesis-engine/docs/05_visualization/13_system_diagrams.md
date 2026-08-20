# System Diagrams

Version: 1.0  
Status: Complete  
Priority: High  

---

## 1. System Overview

```mermaid
graph TB
    subgraph Presentation["Presentation Layer"]
        UI[Web UI]
        CLI[CLI Interface]
        API[API Gateway]
    end
    
    subgraph Application["Application Layer"]
        ORCH[Orchestrator Engine]
        WORK[Workflow Manager]
        STATE[State Machine]
    end
    
    subgraph Agents["Agent Layer"]
        RES[Research Agent]
        DEC[Decision Agent]
        PLN[Planning Agent]
        OUT[Output Agent]
    end
    
    subgraph Business["Business Layer"]
        VAL[Validation Service]
        PRIC[Pricing Service]
        SCORE[Scoring Service]
    end
    
    subgraph Infrastructure["Infrastructure Layer"]
        RG[Research Gateway]
        AG[AI Gateway]
        SG[Storage Gateway]
        QG[Queue Gateway]
        EG[Export Gateway]
    end
    
    subgraph External["External Systems"]
        SEARCH[Search APIs<br/>Exa/Tavily/Brave]
        AI[AI Providers<br/>OpenRouter/Gemini]
        DB[(PostgreSQL)]
        CACHE[(Redis)]
        STORE[Object Storage<br/>S3/GCS]
    end
    
    UI --> API
    CLI --> API
    API --> ORCH
    
    ORCH --> WORK
    WORK --> STATE
    
    ORCH --> RES
    ORCH --> DEC
    ORCH --> PLN
    ORCH --> OUT
    
    RES --> RG
    DEC --> AG
    PLN --> AG
    OUT --> EG
    OUT --> SG
    
    RG --> SEARCH
    AG --> AI
    SG --> DB
    SG --> CACHE
    EG --> STORE
```

---

## 2. Workflow Execution Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as API Gateway
    participant ORCH as Orchestrator
    participant RES as Research Agent
    participant DEC as Decision Agent
    participant PLN as Planning Agent
    participant OUT as Output Agent
    
    U->>API: Submit Idea
    API->>ORCH: Create Project
    
    ORCH->>ORCH: State: IDEA → RESEARCHING
    
    ORCH->>RES: Execute Research Query
    RES-->>ORCH: Evidence Collection
    
    ORCH->>ORCH: State: RESEARCHING → DECIDING
    
    ORCH->>DEC: Execute Decision Query
    DEC-->>ORCH: Decision + Confidence
    
    alt Recommendation: PROCEED
        ORCH->>ORCH: State: DECIDING → PLANNING
        
        ORCH->>PLN: Execute Planning Query
        PLN-->>ORCH: Implementation Plan
        
        ORCH->>ORCH: State: PLANNING → OUTPUT
        
        ORCH->>OUT: Generate Artifacts
        OUT-->>ORCH: Exported Files
        
        ORCH->>ORCH: State: OUTPUT → COMPLETED
        ORCH-->>U: Complete Package
    else Recommendation: PIVOT/ABANDON
        ORCH->>ORCH: State: DECIDING → COMPLETED
        ORCH-->>U: Pivot Report
    end
```

---

## 3. Architecture Dependencies

```mermaid
graph LR
    subgraph Core
        VO[Value Objects]
        ENT[Entities]
        EVT[Events]
    end
    
    subgraph Interfaces
        AGENT[Agent Interfaces]
        GATE[Gateway Interfaces]
        REPO[Repository Interfaces]
    end
    
    subgraph Agents
        RES[Research Agent]
        DEC[Decision Agent]
        PLN[Planning Agent]
        OUT[Output Agent]
    end
    
    subgraph Adapters
        RA[Research Adapter]
        AA[AI Adapter]
        SA[Storage Adapter]
        EA[Export Adapter]
    end
    
    Core --> Interfaces
    Agents --> Interfaces
    Adapters --> Interfaces
    Agents -.-> Core
```

---

## 4. Retry & Rollback Flow

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> EXECUTING: Start Workflow
    
    state EXECUTING {
        [*] --> RESEARCH
        RESEARCH --> DECIDING: Success
        RESEARCH --> RETRY_RESEARCH: Failure
        RETRY_RESEARCH --> RESEARCH: Retry
        RETRY_RESEARCH --> FAIL: Max Retries
        
        DECIDING --> PLANNING: Proceed
        DECIDING --> COMPLETE: Pivot/Abandon
        DECIDING --> RETRY_DECIDE: Failure
        RETRY_DECIDE --> DECIDING: Retry
        RETRY_DECIDE --> FAIL: Max Retries
        
        PLANNING --> OUTPUT: Success
        PLANNING --> RETRY_PLAN: Failure
        RETRY_PLAN --> PLANNING: Retry
        RETRY_PLAN --> FAIL: Max Retries
        
        OUTPUT --> COMPLETE: Success
        OUTPUT --> RETRY_OUTPUT: Failure
        RETRY_OUTPUT --> OUTPUT: Retry
        RETRY_OUTPUT --> FAIL: Max Retries
    }
    
    EXECUTING --> FAIL: Circuit Breaker Open
    EXECUTING --> COMPLETE: Success
    FAIL --> IDLE: Reset
    COMPLETE --> IDLE: New Workflow
```

---

## 5. Memory Lifetime

```mermaid
sequenceDiagram
    participant ORCH as Orchestrator
    participant MEM as Memory/Cache
    participant DB as Database
    participant GC as Garbage Collector
    
    ORCH->>MEM: Create CorrelationId
    ORCH->>MEM: Store Workflow State
    
    loop Workflow Execution
        ORCH->>MEM: Update State
        ORCH->>DB: Persist Checkpoint
    end
    
    ORCH->>DB: Final Persist
    ORCH->>MEM: Clear Workflow State
    
    note right of MEM: TTL Expires
    MEM->>GC: Auto-Cleanup
```

---

## 6. Implementation Roadmap

```mermaid
gantt
    title Genesis Engine Implementation Phases
    dateFormat  YYYY-MM-DD
    section Foundation
    Project Rules           :done,    rules, 2025-08-01, 2d
    AI Bootstrap            :done,    bootstrap, 2025-08-02, 2d
    System Architecture     :done,    arch, 2025-08-03, 3d
    Repository Structure    :done,    repo, 2025-08-04, 2d
    
    section Phase 1-2
    Domain Model            :done,    domain, 2025-08-05, 3d
    Value Objects           :done,    vo, 2025-08-06, 2d
    Interface Contracts     :done,    interfaces, 2025-08-07, 3d
    Test Suite              :done,    tests, 2025-08-08, 2d
    
    section Phase 3
    Research Agent          :done,    res_agent, 2025-08-10, 3d
    Decision Agent          :done,    dec_agent, 2025-08-11, 3d
    Planning Agent          :done,    pln_agent, 2025-08-12, 4d
    Output Agent            :done,    out_agent, 2025-08-13, 3d
    Orchestrator            :done,    orch, 2025-08-14, 3d
    
    section Phase 4 (Current)
    Gateway Interfaces      :done,    gateways, 2025-08-15, 2d
    In-Memory Adapters      :done,    memory_adapt, 2025-08-16, 2d
    Documentation           :active,  docs, 2025-08-19, 2d
    
    section Phase 5 (Next)
    AI Gateway Adapter      :         ai_adapter, 2025-08-21, 4d
    PostgreSQL Adapter      :         pg_adapter, 2025-08-22, 4d
    Export Gateway          :         export_adapt, 2025-08-23, 3d
    Config Vault            :         config, 2025-08-24, 2d
    
    section Phase 6
    Queue Gateway           :         queue, 2025-08-26, 3d
    Production Adapters     :         prod_adapt, 2025-08-27, 5d
    Circuit Breaker         :         circuit, 2025-08-28, 2d
    
    section Phase 7
    API Layer               :         api, 2025-09-01, 5d
    CLI Interface           :         cli, 2025-09-02, 3d
    Deployment              :         deploy, 2025-09-05, 5d
```

---

## 7. Gateway Flow

```mermaid
graph TB
    subgraph Request
        REQ[Agent Request]
    end
    
    subgraph Gateway
        VAL[Input Validation]
        CB[Circuit Breaker]
        RTY[Retry Manager]
        MET[Metrics Collector]
        LOG[Logger]
        ADP[Adapter Selector]
    end
    
    subgraph Adapters
        ADP1[Adapter 1]
        ADP2[Adapter 2]
        ADP3[Adapter 3]
    end
    
    subgraph External
        EXT[External Provider]
    end
    
    REQ --> VAL
    VAL --> CB
    CB --> RTY
    RTY --> ADP
    ADP --> ADP1
    ADP --> ADP2
    ADP --> ADP3
    ADP1 --> EXT
    ADP2 --> EXT
    ADP3 --> EXT
    
    MET -.-> VAL
    MET -.-> CB
    MET -.-> RTY
    MET -.-> ADP
    LOG -.-> VAL
    LOG -.-> CB
    LOG -.-> RTY
    LOG -.-> EXT
```

---

## 8. Data Flow

```mermaid
flowchart TD
    Idea[Idea Input] --> Validate[Validate & Create Project]
    Validate --> Research[Research Phase]
    
    subgraph Research
        Market[Market Analysis]
        Competitor[Competitor Scan]
        Tech[Tech Research]
        Market --> Evidence[Evidence Collection]
        Competitor --> Evidence
        Tech --> Evidence
    end
    
    Evidence --> Decide[Decision Phase]
    
    subgraph Decide
        Analyze[Analyze Evidence]
        Score[Calculate Confidence]
        Risk[Identify Risks]
        Analyze --> Score
        Score --> Risk
        Risk --> Recommendation[Recommendation]
    end
    
    Recommendation --> Check{Proceed?}
    
    Check -->|Yes| Plan[Planning Phase]
    Check -->|No| Pivot[Pivot Report]
    
    subgraph Plan
        PRD[PRD Generation]
        Arch[Architecture Design]
        Roadmap[Roadmap Creation]
        PRD --> Arch
        Arch --> Roadmap
    end
    
    Roadmap --> Export[Export Phase]
    
    subgraph Export
        MD[Markdown Docs]
        Mermaid[Mermaid Diagrams]
        ZIP[ZIP Package]
    end
    
    Export --> Output[Final Output]
    Pivot --> Output
```

---

## Related Documents

- `01_system_architecture.md` - Architecture overview
- `11_agent_specifications.md` - Agent details
- `12_gateway_implementation_guide.md` - Gateway guide

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-08-19 | Initial diagrams complete |
