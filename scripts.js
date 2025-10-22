import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const mermaids = {
    "message": `
sequenceDiagram
    autonumber
    participant P1 as Processor 1
    participant R1 as Runner 1
    participant O as Orchestrator
    participant R2 as Runner 2
    participant P2 as Processor 2

    Note over P1: Processor generates message for a channel
    P1->>R1: Message with data
    rect rgba(0, 0, 255, .1)
        R1->>O: Send message to orchestrator<br>mainStream(FromRunner{msg: SendingMessage { localSequenceNumber, channel, data }})
    end

    Note over O: Orchestrator routes message to target instantiator
    rect rgba(0, 0, 255, .1)
        O->>R2: Forward message to receiving runner <br>mainStream(ToRunner{msg: ReceivingMessage{ globalSequenceNumber, channel, data }})
    end

    R2->>P2: Runner forwards message to target processor
    P2->>P2: Process message

    P2->>R2: Message processed
    rect rgba(0, 0, 255, .1)
        R2->>O: mainStream(FromRunner{processed: GlobalAck{ globalSequenceNumber, channel }})
    end
    rect rgba(0, 0, 255, .1)
        O->>R1: mainStream(ToRunner{processed: LocalAck{ localSequenceNumber, channel }})
    end
    Note over P1: Processor is allowed to send a new message
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
    
      P1 w1@-.-|1: writes| A@{ shape: processes, label: "Channel" }
      P3 w3@-.-|5: writes| A
      P4 w4@-.-|3: writes| A
      P2 r2@-.-|6: reads| A
      P3 r3@-.-|4: reads| A
      P4 r4@-.-|2: reads| A
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

    Note over O: Initialize gRPC server <br>Load and parse RDF pipeline configuration

    loop For each instantiator in pipeline
        O->>R: Start runner process
        rect rgba(255, 0, 0, .1)
            R->>O: stub.connect() as mainStream
        end
        rect rgba(0, 0, 255, .1)
            R->>O: mainStream(FromRunner{identify: RunnerIdentify{ uri }})
        end
        rect rgba(0, 0, 255, .1)
            O->>R: Send pipeline configuration<br> mainStream(ToRunner{ pipeline })
        end
    end

    Note over O,P: Initialize all processors
    loop For each processor in each runner
        rect rgba(0, 0, 255, .1)
            O->>R: Start processor with configuration<br> mainStream(ToRunner{proc: Processor{ uri, config, arguments }})
        end
        R->>P: Initialize processor
        P->>R: Processor ready
        rect rgba(0, 0, 255, .1)
            R->>O: Initialized message with processor URI<br>mainStream(FromRunner{initialized: ProcessorInitialized{ uri, error? }})
        end
    end

    Note over O,P: Start all runners
    loop For each runner
        rect rgba(0, 0, 255, .1)
            O->>R: Processors can start<br> mainStream(ToRunner{ start })
        end
        loop For each processor in runner
            R->>P: Start processor execution
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

    P1->>R1: Start streaming message
    rect rgba(255, 0, 0, .1)
        R1->>O: Initiate sending stream<br>stub.sendStreamMessage() as sendingStream
    end
    R1->>O: Send identify message<br>sendingStream(StreamChunk{id: StreamIdentify{ localSequenceNumber, channel, runner }})

    rect rgba(0, 0, 255, .1)
        O->>R2: Notify receiving runner of incoming stream message <br> mainStream(ToRunner{streamMsg: ReceivingStreamMessage{ globalSequenceNumber, channel }})
    end
    rect rgba(255, 0, 0, .1)
        R2->>O: Initiate receiving stream<br>stub.receiveStreamMessage() as receivingStream
    end
    R2->>O: Send identify message <br> receivingStream(SendingStreamControl{ globalSequenceNumber })
    O->>R1: Send stream control message, indicating that the stream is ready to accept data <br> sendingStream(ReceivingStreamControl{ streamSequenceNumber })

    Note over P1: Begin streaming data
    loop For Each Chunk
        P1->>R1: Send a chunk of data
        R1->>O: Send a chunk<br>sendingStream(StreamChunk{data: DataChunk{ data }})
        O->>R2: Receive a chunk<br>receivingStream(DataChunk{ data })
        R2->>P2: Forward chunks to processor
        P2->>P2: Handle chunk
        P2->>R2: Chunk handled
        R2->>O: sequence number of the chunk in the stream <br> receivingStream(SendingStreamControl{ streamSequenceNumber })
        O->>R1: sendingStream(ReceivingStreamControl{ streamSequenceNumber })
        Note over P1: Processor is allowed to send a new chunk
    end

    P1->>R1: End of stream
    R1->>O: sendingStream closed
    O->>R2: receivingStream closed
    rect rgba(0, 0, 255, .1)
        R2->>O: mainStream(FromRunner{processed: GlobalAck{ globalSequenceNumber, channel }})
    end
    rect rgba(0, 0, 255, .1)
        O->>R1: mainStream(ToRunner{processed: LocalAck{ localSequenceNumber, channel }})
    end
    Note over P1: Processor is allowed to send a new message
`
};

// We do this, as sometimes bikeshed interacts with characters like |
for (const container of [...document.querySelectorAll(".mermaid")]) {
    const content = mermaids[container.id]
    if (!content) {
        console.log(`Failed to find ${container.id} in ${Object.keys(mermaids)} `)
        continue
    }
    container.innerHTML = content;
}

mermaid.initialize({ startOnLoad: true });
