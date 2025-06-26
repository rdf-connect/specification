import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const mermaids = {
    "message": `
sequenceDiagram
    participant P1 as Processor 1
    participant R1 as Runner 1
    participant O as Orchestrator
    participant R2 as Runner 2
    participant P2 as Processor 2
    P1-->>R1: Msg to Channel A
    R1-->>O: Msg to Channel A
    Note over O: Channel A is connected<br>to processor of Runner 2
    O -->> R2: Msg to Channel A
    R2-->>P2: Msg to Channel A
`,
    "overview": `
flowchart TD
    U(User) -->|starts with pipeline.ttl| O[Orchestrator]
    O -->|instantiates| JS[fab:fa-js Runner]
    O -->|instantiates| PY[fab:fa-python Runner]
    O -->|instantiates| JVM[fab:fa-java Runner]
    subgraph  
    JS -->|runs| P1[HTTP Fetch<br>processor]
    JS -->|runs| P2[SPARQL Construct<br>processor]
    end
    subgraph  
    PY -->|runs| P3[ML processor]
    end
    subgraph  
    JVM -->|runs| P4[RML processor]
    end
    direction LR
    
    P1 w1@-.-|writes| A@{ shape: processes, label: "Channel" }
    P3 w3@-.-|writes| A
    P4 w4@-.-|writes| A
    P2 r2@-.-|reads| A
    P3 r3@-.-|reads| A
    P4 r4@-.-|reads| A
    classDef animateRead stroke-dasharray: 9,5,stroke-dashoffset: 900,animation: dash 25s linear infinite reverse;
    class r2,r3,r4 animateRead
    classDef animateWrite stroke-dasharray: 9,5,stroke-dashoffset: 900,animation: dash 25s linear infinite;
    class w1,w3,w4 animateWrite
`,
    "startup": `
sequenceDiagram
    autonumber
    participant O as Orchestrator
    participant R as Runner
    participant P as Processor
    Note over O: Discovered Runners<br>and processors
    loop For every runner
        Note over R: Runner is started with cli
        O-->>R: Startup with address and uri
        R-->>O: RPC.Identify: with uri
        O-->>R: RPC.Pipeline: with expanded pipeline
    end
    loop For every processor
        O-->>R: RPC.Processor: Start processor
        Note over P: Load module and class
        R-->>P: Load processor
        R-->>P: Start processor with args
        R-->>O: RPC.ProcessorInit: processor started
    end
    loop For every runner
        O-->>R: RPC.Start: Start
        loop For every Processor
            R-->>P: Start
        end
    end
`,
    "streamMessage": `
sequenceDiagram
    autonumber
    participant P1 as Processor 1
    participant R1 as Runner 1
    participant O as Orchestrator
    participant R2 as Runner 2
    participant P2 as Processor 2
    P1 -->> R1: Send streaming<br>message
    critical Start stream message
        R1 ->> O: rpc.sendStreamMessage<br>(bidirectional stream)
        O -->> R1: sends generated ID<br>of stream message
        R1 -->> O: announce StreamMessage<br>with ID over normal stream
        O -->> R2: announce StreamMessage<br>with ID over normal stream
        R2 ->> O: rpc.receiveMessage with Id<br>starts receiving stream
        R2 -->> P2: incoming stream message
    end
    loop Streams data
        P1 -->> R1: Data chunks
        R1 -->> O: Data chunks over stream
        O -->> R2: Data chunks over stream
        R2 -->>P2: Data chnuks
    end
`
};

// We do this, as sometimes bikeshed interacts with characters like |
for (const container of [...document.querySelectorAll(".mermaid")]) {
    const content = mermaids[container.id]
    if (!content) {
        console.log(`Failed to find ${container.id} in ${Object.keys(mermaids)}`)
        continue
    }
    container.innerHTML = content;
}

mermaid.initialize({ startOnLoad: true });
