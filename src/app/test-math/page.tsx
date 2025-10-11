"use client";

import * as React from "react";

export default function TestMathPage() {
  const [latex, setLatex] = React.useState("");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Math Block Textarea Test</h1>

      {/* Test 1: Absolute minimal textarea */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Test 1: Minimal (should work)</h2>
        <div
          style={{
            width: "500px",
            maxWidth: "500px",
            border: "2px solid red",
            overflow: "hidden",
          }}
        >
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              padding: "0.5rem",
              fontFamily: "monospace",
            }}
            placeholder="Type a long formula here..."
          />
        </div>
      </div>

      {/* Test 2: With your actual Card/InputGroup structure */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Test 2: With Card structure</h2>
        <div
          style={{
            width: "500px",
            maxWidth: "500px",
            border: "2px solid blue",
            overflow: "hidden",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <textarea
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  padding: "0.5rem",
                  fontFamily: "monospace",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                placeholder="Type a long formula here..."
              />
              <div style={{ fontSize: "0.7rem", color: "#888" }}>
                {latex.length}/300
              </div>
            </div>
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <button style={{ padding: "0.5rem" }}>✓</button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#ffffcc",
        }}
      >
        <h3>Test Instructions:</h3>
        <p>Type this long formula in both textareas:</p>
        <code
          style={{
            display: "block",
            padding: "0.5rem",
            backgroundColor: "white",
          }}
        >
          \frac{"{-b \\pm \\sqrt{b^2-4ac}}"}
          {"{2a}"} + \int_{"{0}"}^{"{\\infty}"} e^{"{-x^2}"} dx + \sum_{"{n=1}"}
          ^{"{\\infty}"} \frac{"{1}"}
          {"{n^2}"}
        </code>
        <p>
          <strong>Expected:</strong> Text should wrap within the red/blue boxes
        </p>
        <p>
          <strong>If it spreads:</strong> Screenshot it and tell me which test
          fails
        </p>
      </div>
    </div>
  );
}
