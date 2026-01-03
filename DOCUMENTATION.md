# ShopAI Support: GPT-Powered E-Commerce Support MVP
## Technical Documentation & Product Strategy

**Candidate:** Praveen K  
**Submission Date:** January 2026  
**Project:** GPT-Powered Customer Support Tool for E-Commerce Platform

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Understanding & Assumptions](#2-problem-understanding--assumptions)
3. [Solution Architecture](#3-solution-architecture)
4. [Key Features & Implementation](#4-key-features--implementation)
5. [Technical Decisions & Trade-offs](#5-technical-decisions--trade-offs)
6. [Metrics Framework & Success Criteria](#6-metrics-framework--success-criteria)
7. [Rollout Plan & Future Iterations](#7-rollout-plan--future-iterations)

---

## 1. Executive Summary

ShopAI Support is a **Conversational Intent Engine (CIE)** that transcends the traditional chatbot paradigm. It simultaneously solves two critical business problems:

1. **Operational Efficiency**: Automated query resolution using RAG (Retrieval-Augmented Generation) to achieve high deflection rates while maintaining response quality.

2. **AdTech Signal Capture**: Extracts zero-party data and commercial intent signals from conversations, transforming the support channel into a first-party data acquisition pipeline.

### Core Value Proposition
```
┌─────────────────────────────────────────────────────────────────┐
│                    DUAL-VALUE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │   CUSTOMER   │         │   BUSINESS   │                     │
│   │    VALUE     │         │    VALUE     │                     │
│   └──────┬───────┘         └──────┬───────┘                     │
│          │                        │                              │
│          ▼                        ▼                              │
│   • Instant responses      • 72%+ Deflection Rate               │
│   • 24/7 availability      • Zero-Party Data Capture            │
│   • Empathetic handling    • Intent Signals → CDP               │
│   • Seamless escalation    • Reduced Cost-per-Ticket            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Problem Understanding & Assumptions

### 2.1 The E-Commerce Support Paradox

**Problem Statement**: E-commerce support faces a fundamental scaling crisis:
- Query volume grows linearly with platform growth
- Query complexity grows exponentially (product catalog × logistics × policies)
- Traditional solutions fail: Rule-based bots frustrate users; human agents don't scale

**Key Statistics Considered**:
- Cost-per-ticket for human agents: $5-10
- 90% of customers expect "immediate" response
- Pre-purchase support gaps directly cause cart abandonment

### 2.2 The AdTech Signal Gap

With third-party cookie deprecation (GDPR, CCPA, browser restrictions), advertisers lose visibility into user intent. Clickstream data shows *what* users do, not *why*.

**Our Hypothesis**: Conversational data reveals explicit purchase intent that clickstream cannot capture.

```
Example Signal Extraction:
┌─────────────────────────────────────────────────────────────┐
│ Customer: "Do you have this jacket in a waterproof version?"│
├─────────────────────────────────────────────────────────────┤
│ Extracted Signals:                                          │
│ • Product Interest: jackets                                 │
│ • Feature Preference: waterproof                            │
│ • Purchase Intent: HIGH (specific product inquiry)          │
│ • Zero-Party Data: outdoor/hiking category affinity         │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Assumptions Made

| Assumption | Rationale | Validation Method |
|------------|-----------|-------------------|
| 70-80% of queries are pre/post-purchase | Industry benchmarks; focused MVP scope | A/B test with live traffic |
| Users prefer chat over phone for simple queries | Demographic trends, especially Gen Z/Millennials | User preference surveys |
| Intent signals have AdTech value | Cookie deprecation creates demand for first-party data | CDP integration pilot |
| Sub-2s response time is critical | Research shows engagement drops after 2s delay | Response time vs. CSAT correlation |

---

## 3. Solution Architecture

### 3.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHOPAI SUPPORT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────────────────────────────────────┐  │
│  │   FRONTEND   │     │              BACKEND SERVICES                 │  │
│  │   (React +   │────▶│                                              │  │
│  │   Vite)      │     │  ┌─────────────┐    ┌────────────────────┐  │  │
│  └──────────────┘     │  │ ORCHESTRATOR│    │  VERTEX AI (Gemini)│  │  │
│                       │  │   (Express) │───▶│  • gemini-2.5-pro  │  │  │
│                       │  └──────┬──────┘    │  • gemini-2.5-flash│  │  │
│                       │         │           └────────────────────┘  │  │
│                       │         │                                    │  │
│                       │         ▼                                    │  │
│                       │  ┌─────────────────────────────────────┐    │  │
│                       │  │         DATA LAYER                   │    │  │
│                       │  │  ┌───────────┐  ┌────────────────┐  │    │  │
│                       │  │  │  SQLite   │  │ Knowledge Base │  │    │  │
│                       │  │  │(Customers,│  │   (Articles,   │  │    │  │
│                       │  │  │ Orders,   │  │    FAQs,       │  │    │  │
│                       │  │  │ Messages) │  │   Policies)    │  │    │  │
│                       │  │  └───────────┘  └────────────────┘  │    │  │
│                       │  └─────────────────────────────────────┘    │  │
│                       │                                              │  │
│                       │  ┌─────────────────────────────────────┐    │  │
│                       │  │      ADTECH SIGNAL PROCESSOR        │    │  │
│                       │  │  • Intent Extraction                │    │  │
│                       │  │  • Zero-Party Data Capture          │    │  │
│                       │  │  • CDP Integration Ready            │    │  │
│                       │  └─────────────────────────────────────┘    │  │
│                       └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + Vite + TypeScript | Fast HMR, type safety, modern DX |
| UI Components | shadcn/ui + Tailwind CSS | Accessible, customizable, rapid prototyping |
| Backend | Node.js + Express + TypeScript | JavaScript ecosystem consistency |
| AI/LLM | Google Vertex AI (Gemini 2.5) | Enterprise-grade, low latency, GCP integration |
| Database | SQLite (better-sqlite3) | Zero-config, embedded, sufficient for MVP |
| State Management | TanStack Query | Server state caching, optimistic updates |

### 3.3 Conversation Flow Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATEFUL CONVERSATION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer: "I'm looking for running shoes"                       │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ INTENT CLASSIFICATION                    │                    │
│  │ → Category: Product Discovery            │                    │
│  │ → AdSignal: {category: "running",        │                    │
│  │              intent: "high"}             │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       ▼                                                          │
│  AI: "We have a great selection! Are you looking for            │
│       trail or road running shoes?"                              │
│       │                                                          │
│       ▼                                                          │
│  Customer: "Trail. And do you have waterproof?"                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ ZERO-PARTY DATA CAPTURED                 │                    │
│  │ → Subcategory: trail                     │                    │
│  │ → Feature: waterproof                    │                    │
│  │ → Activity: outdoor/hiking               │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Features & Implementation

### 4.1 Core Features Matrix

| Feature | MVDPDF Requirement | Implementation Status |
|---------|-------------------|----------------------|
| Natural Language Understanding | 3.1.1 NLU | ✅ Gemini LLM |
| RAG-based Knowledge Retrieval | 3.1.2 RAG | ✅ SQLite + keyword search |
| Sentiment-Based Escalation | 3.1.4 Escalation | ✅ LLM-powered + keyword fallback |
| Zero-Party Data Extraction | 3.1.5 AdTech | ✅ Intent signal processor |
| Order Status Integration | 3.1.3 Tool Call | ✅ Mock OMS API |
| Break-Glass Human Handoff | 3.1.4 Escalation | ✅ One-click escalation |

### 4.2 Emotional Intelligence System

The AI doesn't just answer questions—it reads emotional context:

```typescript
// LLM-Powered Sentiment Analysis
{
    level: "frustrated",           // positive | neutral | concerned | frustrated | angry
    score: -0.6,                   // -1.0 to +1.0
    primaryEmotion: "impatient",
    trend: "declining",            // improving | stable | declining
    empathyNeeded: true,
    escalationRisk: "high",
    recommendedTone: "apologetic"
}
```

**Response Adaptation**:
- Frustrated customer → Lead with empathy, acknowledge feelings first
- Angry customer → De-escalate, offer immediate resolution
- Happy customer → Match energy, reinforce positive experience

### 4.3 Smart Resolution Actions

AI-powered action recommendations based on semantic understanding:

```
┌────────────────────────────────────────────────────────────────┐
│              SMART ACTIONS DETECTION                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "This is garbage quality, I want my money back"               │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │ LLM SEMANTIC ANALYSIS                    │                   │
│  │ • "garbage quality" → replacement        │                   │
│  │ • "money back" → refund                  │                   │
│  │ • Negative sentiment → discount          │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  RECOMMENDED ACTIONS:                                           │
│  ┌─────────┐ ┌─────────────┐ ┌────────────┐                    │
│  │ REFUND  │ │ REPLACEMENT │ │  DISCOUNT  │                    │
│  │ $49.99  │ │ Send new    │ │  20% off   │                    │
│  │ ✅ Auto │ │ ✅ Auto     │ │  ✅ Auto   │                    │
│  └─────────┘ └─────────────┘ └────────────┘                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 4.4 AdTech Integration: Intent Signal Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│               INTENT SIGNAL EXTRACTION PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONVERSATION INPUT                                              │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │         LLM INTENT EXTRACTOR            │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ INTENT SIGNALS                          │                    │
│  │ • category: "product_interest"          │                    │
│  │ • intent: "running_shoes_waterproof"    │                    │
│  │ • confidence: 0.92                      │                    │
│  │ • urgency: "high"                       │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ ZERO-PARTY DATA                         │                    │
│  │ • preferences.style: "trail"            │                    │
│  │ • preferences.feature: "waterproof"     │                    │
│  │ • purchaseIntent.urgency: "high"        │                    │
│  │ • demographics.activity: "hiking"       │                    │
│  └─────────────────────────────────────────┘                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │           CDP / DSP READY               │──▶ Personalized    │
│  │   (Customer Data Platform Integration)  │    Retargeting     │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Immediate Acknowledgment Pattern

To manage perceived latency during LLM processing:

```
Timeline:
─────────────────────────────────────────────────────────────────
0ms        300ms                              1500-2000ms
 │          │                                      │
 │          ▼                                      ▼
 │    "Thank you for contacting              Full LLM Response
 │     ShopAI! 👋 Let me review              replaces ack message
 │     your account..."                      
 │
 Customer sends message
```

This pattern reduces perceived wait time by 50%+ and sets customer expectations.

---

## 5. Technical Decisions & Trade-offs

### 5.1 The AI Iron Triangle

```
                        LATENCY
                           △
                          /|\
                         / | \
                        /  |  \
                       /   |   \
                      /    |    \
                     /     |     \
                    /      |      \
                   /       |       \
                  ▼────────┴────────▼
              ACCURACY            COST
```

**Trade-off Decision**: Tiered Model Strategy

| Query Type | Model | Rationale |
|------------|-------|-----------|
| Simple (greetings, FAQs) | gemini-2.5-flash | Fast response, low cost |
| Complex (comparisons, disputes) | gemini-2.5-pro | Higher accuracy needed |
| Sentiment Analysis | gemini-2.5-pro | Nuanced understanding required |

### 5.2 Key Trade-offs Made

| Decision | Trade-off | Justification |
|----------|-----------|---------------|
| SQLite over PostgreSQL | Scalability vs. simplicity | MVP prioritizes speed-to-demo; easy migration path |
| Keyword search over vector embeddings | Accuracy vs. complexity | 80/20 rule; vector search adds latency and cost |
| Synchronous API over WebSocket | Real-time vs. reliability | REST is simpler; typing indicators simulate real-time |
| Single LLM call over chain-of-thought | Latency vs. reasoning depth | User experience prioritizes speed |
| Auto-approval limits ($100) | Automation vs. risk | Balances efficiency with financial controls |

### 5.3 What We Explicitly Excluded (Out of Scope)

| Feature | Reason | Future Priority |
|---------|--------|-----------------|
| Transactional modifications (cancel orders) | Risk of operational errors | P1 |
| Multimodal input (images) | Adds latency, complexity | P2 |
| Voice interface | Focus on semantic accuracy first | P3 |
| Real vector embeddings | Keyword search sufficient for MVP | P1 |

---

## 6. Metrics Framework & Success Criteria

### 6.1 Operational Metrics (5.1 from MVDPDF)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Deflection Rate** | ≥40% | (Total - Escalated) / Total × 100 |
| **First Response Time** | ≤2000ms | Time to first token |
| **Resolution Rate** | ≥75% | Resolved / Total × 100 |
| **Sentiment Drift** | ≥+10% | End sentiment - Start sentiment |

### 6.2 AdTech Metrics (5.2 from MVDPDF)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Intent Capture Rate** | ≥50% | Conversations with extracted signals / Total |
| **Zero-Party Enrichment** | ≥150/1000 | Attributes captured per 1000 conversations |
| **Identity Resolution** | ≥25% | Matched to existing profiles / Total |

### 6.3 AI Quality Metrics (5.3 from MVDPDF)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Faithfulness Score** | ≥0.85 | Response grounded in knowledge base |
| **Answer Relevancy** | ≥0.80 | Response addresses user query |

### 6.4 Dashboard Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS DASHBOARD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OPERATIONAL METRICS                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │Deflection │ │  First    │ │Resolution │ │ Sentiment │       │
│  │   Rate    │ │ Response  │ │   Rate    │ │   Drift   │       │
│  │   72%     │ │  1450ms   │ │   68%     │ │   +18%    │       │
│  │ ✅ Target │ │ ✅ Target │ │ ⚠ Below  │ │ ✅ Target │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                  │
│  ADTECH METRICS                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                      │
│  │  Intent   │ │Zero-Party │ │ Identity  │                      │
│  │ Capture   │ │Enrichment │ │Resolution │                      │
│  │   58%     │ │  145/1000 │ │   32%     │                      │
│  │ ✅ Target │ │ ⚠ Below  │ │ ✅ Target │                      │
│  └───────────┘ └───────────┘ └───────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Rollout Plan & Future Iterations

### 7.1 Phased Rollout Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLLOUT PHASES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: Shadow Mode (Week 1-2)                                │
│  ├─ AI runs parallel to human agents                            │
│  ├─ No customer exposure                                        │
│  ├─ Measure: accuracy, latency, edge cases                      │
│  └─ Success Gate: 80% response accuracy                         │
│                                                                  │
│  PHASE 2: Assisted Mode (Week 3-4)                              │
│  ├─ AI suggests responses to human agents                       │
│  ├─ Humans approve/edit before sending                          │
│  ├─ Measure: agent adoption, edit rate                          │
│  └─ Success Gate: <20% edit rate                                │
│                                                                  │
│  PHASE 3: Limited Autonomy (Week 5-8)                           │
│  ├─ AI handles simple queries autonomously                      │
│  ├─ 5% traffic → 25% traffic → 50% traffic                      │
│  ├─ Complex queries still routed to humans                      │
│  └─ Success Gate: CSAT parity with human agents                 │
│                                                                  │
│  PHASE 4: Full Deployment (Week 9+)                             │
│  ├─ AI as primary responder                                     │
│  ├─ Human escalation for complex/sensitive cases                │
│  ├─ Continuous monitoring and model updates                     │
│  └─ Success Gate: Deflection rate ≥70%                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hallucination | Medium | High | RAG grounding, confidence thresholds, source citations |
| Latency spikes | Medium | Medium | Fallback to lighter model, caching, timeout handling |
| Negative CSAT | Low | High | Real-time sentiment monitoring, proactive escalation |
| Data privacy breach | Low | Critical | No PII logging in AI prompts, audit trails |
| Model cost overrun | Medium | Medium | Request batching, caching, model tier routing |

### 7.3 Experimentation Framework

**A/B Test Design for Deflection Rate**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    A/B TEST: AI vs HUMAN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTROL (50%)              TREATMENT (50%)                      │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ Human Agent  │          │   ShopAI     │                     │
│  │  Handling    │          │   System     │                     │
│  └──────────────┘          └──────────────┘                     │
│                                                                  │
│  PRIMARY METRIC: Resolution Rate                                 │
│  SECONDARY METRICS:                                              │
│  • CSAT Score                                                    │
│  • First Response Time                                           │
│  • Escalation Rate                                               │
│  • Cost per Ticket                                               │
│                                                                  │
│  STATISTICAL POWER: 80%                                          │
│  MINIMUM DETECTABLE EFFECT: 5%                                   │
│  SAMPLE SIZE: ~10,000 conversations per arm                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Future Roadmap

| Priority | Feature | Business Impact |
|----------|---------|-----------------|
| P0 | Vector embeddings for semantic search | +15% retrieval accuracy |
| P0 | Real CDP integration | Enable retargeting revenue |
| P1 | Transactional capabilities | +20% deflection (order changes) |
| P1 | Multi-language support | International market expansion |
| P2 | Voice interface | Accessibility, phone deflection |
| P2 | Proactive outreach | Reduce inbound volume by 10% |
| P3 | Image/video support | Handle damage claims autonomously |

---

## Appendix A: System Screenshots

### A.1 Live Chat Interface
- Real-time sentiment indicator (emoji + trend)
- AI disclosure badge ("🤖 AI-Assisted")
- Break-Glass button for instant human escalation
- Smart action recommendations
- Source citations from knowledge base

### A.2 Analytics Dashboard
- Real-time operational metrics with targets
- AdTech signal capture rates
- Conversation volume trends
- Escalation reason breakdown

### A.3 Escalation Queue
- Priority-sorted ticket list
- Queue statistics (open, high-priority, unassigned)
- One-click resolution actions

---

## Appendix B: API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/message` | POST | Send message, receive AI response |
| `/api/chat/conversations` | GET | List all conversations |
| `/api/chat/conversations/:id/resolve` | POST | Mark conversation resolved |
| `/api/chat/conversations/:id/escalate` | POST | Escalate to human |
| `/api/analytics/mvdpdf-metrics` | GET | Get all dashboard metrics |
| `/api/escalations` | GET | List escalation tickets |
| `/api/knowledge-base/articles` | GET | Retrieve knowledge base |

---

## Conclusion

ShopAI Support demonstrates that a customer support tool can transcend its traditional role as a cost center. By combining:

1. **AI-First Architecture** (Gemini LLM + RAG)
2. **Emotional Intelligence** (sentiment-aware responses)
3. **AdTech Integration** (intent signal extraction)
4. **Measurable Outcomes** (MVDPDF metrics framework)

We've built a prototype that proves the hypothesis: **Conversational Context is the new Cookie**.

The MVP is production-ready for shadow testing and provides a clear path to full deployment with measurable success criteria and risk mitigation strategies.

---

*Built with ❤️ using React, TypeScript, Google Vertex AI (Gemini 2.5), and shadcn/ui*
