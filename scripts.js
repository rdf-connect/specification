import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const mermaids = {
  message: `
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
  overview: `
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
  startup: `
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
  streamMessage: `
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
`,
};
// Function to fit SVG proportionally
function fitSVGToScreen(svg, newSvg) {
  svg.style.width = "auto";
  svg.style.height = "auto";
  svg.style.maxWidth = "100%";
  svg.style.maxHeight = "100%";
  svg.style.display = "block";

  // Get viewport ratio and SVG ratio
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bbox = svg.getBBox();
  const svgRatio = bbox.width / bbox.height;
  const viewportRatio = vw / vh;

  console.log({ viewportRatio, svgRatio });
  if (svgRatio > viewportRatio) {
    // SVG is wider than viewport → fill width
    newSvg.style.width = "95vw";
    newSvg.style.height = "auto";
  } else {
    // SVG is taller → fill height
    newSvg.style.width = "auto";
    newSvg.style.height = "95vh";
  }
}

function createModal() {
  // Create modal
  const modal = document.createElement("div");
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.8)";
  modal.style.zIndex = "9999";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.overflow = "auto";

  const modalContent = document.createElement("div");
  modalContent.style.position = "relative";
  modalContent.style.background = "white";
  modalContent.style.borderRadius = "8px";
  modalContent.style.maxWidth = "95vw";
  modalContent.style.maxHeight = "95vh";
  modalContent.style.overflow = "auto";
  modalContent.style.padding = "1rem";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML =
    '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>';
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "0.5rem";
  closeBtn.style.right = "0.5rem";
  closeBtn.style.color = "dark-grey";
  closeBtn.style.border = "none";
  closeBtn.style.padding = "0.5rem 1rem";
  closeBtn.style.borderRadius = "4px";
  closeBtn.style.cursor = "pointer";

  const modalDiagram = document.createElement("div");
  modalDiagram.style.display = "flex";
  modalDiagram.style.justifyContent = "center";
  modalDiagram.style.alignItems = "center";
  modalDiagram.style.width = "100%";
  modalDiagram.style.height = "100%";

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalDiagram);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  closeBtn.addEventListener("click", () => (modal.style.display = "none"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.style.display = "none";
  });
  return [modal, modalDiagram];
}

function wrapElement(pre, modal, modalDiagram) {
  // Create a container div
  const container = document.createElement("div");
  container.classList.add("wrapper");

  // Insert container before the pre
  pre.parentNode.insertBefore(container, pre);
  container.appendChild(pre);

  // Create Full Screen button
  const btn = document.createElement("button");
  btn.innerHTML =
    '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
  btn.style.margin = "0.5rem 0";
  btn.style.padding = "0.3rem 0.6rem";
  btn.style.border = "none";
  btn.style.borderRadius = "4px";
  btn.style.cursor = "pointer";

  container.insertBefore(btn, pre);

  // Event handlers
  btn.addEventListener("click", () => {
    const svg = pre.querySelector("svg");
    if (!svg) return alert("Diagram not rendered yet!");
    modalDiagram.innerHTML = "";
    const newSvg = svg.cloneNode(true);
    fitSVGToScreen(svg, newSvg);
    modalDiagram.appendChild(newSvg);
    modal.style.display = "flex";
  });
}

// We do this, as sometimes bikeshed interacts with characters like |
for (const container of [...document.querySelectorAll(".mermaid")]) {
  const content = mermaids[container.id];
  if (!content) {
    console.log(`Failed to find ${container.id} in ${Object.keys(mermaids)} `);
    continue;
  }
  container.innerHTML = content;
}

mermaid.initialize({ startOnLoad: true });

const [modal, modalDiagram] = createModal();
window.addEventListener("resize", () => {
  const svg = modalDiagram.querySelector("svg");
  if (svg) fitSVGToScreen(svg, svg);
});
for (const container of [...document.querySelectorAll(".mermaid")]) {
  wrapElement(container, modal, modalDiagram);
}
