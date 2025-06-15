# ⚖️ EquiCourt

**EquiCourt** ends petty disputes in under 3 minutes. Upload photos, audio, or documents — and our AI judge cites exact laws and issues a transparent, fair verdict. Built to make justice **swift, accessible, and AI-driven**.

![EquiCourt Screenshot](https://d112y698adiu2z.cloudfront.net/photos/production/software_photos/003/476/195/datas/original.png)

---

## 🚀 Inspiration

Millions of minor disputes — parking tickets, landlord-tenant conflicts, broken agreements — clog our courts and overwhelm self-represented litigants. We asked:

> *“What if an AI judge could understand messy evidence, interpret the law, and resolve disputes in minutes?”*

## 🧠 What It Does

EquiCourt is a **multimodal, multi-LLM micro-litigation platform** that:

- Accepts **text, PDFs, images, and voice recordings** as evidence
- Records and transcribes live conversations using the **Web Speech API**
- Summarizes the dispute using **Cohere Command R+**
- Issues verdicts and remedies using **Gemini 2.0 Flash**, grounded in Canadian law via a **RAG pipeline**
- Cites legal precedents, with **confidence bars** and **clear remedy suggestions**

## 🏗️ How We Built It

- **Frontend**: Vite, custom UI for evidence intake and session recording
- **Multimodal Intake**:
  - 🧾 PDFs & screenshots → parsed via [Docling](https://docling.io)
  - 🎙️ Speech captured using MDN Web Speech API
- **Reasoning Core**:
  - 🤖 `Cohere Command R+` summarizes each party’s speech and uploaded material
  - 🧠 `Gemini 2.0 Flash` applies reasoning with a RAG system connected to Canadian legal texts
- **RAG System**:
  - Retrieves statutes and constitutional laws dynamically
  - Applies fine-grained chunking and compression to optimize LLM context windows


## 🛠️ Tech Stack

| Category       | Tools Used                                    |
|----------------|-----------------------------------------------|
| Frontend       | Vite, JavaScript                              |
| Speech Input   | MDN Web Speech API                            |
| PDF/Doc Input  | Docling                                        |
| LLMs           | Cohere Command R+, Gemini 2.0 Flash           |
| Legal Reasoning| RAG pipeline, Canadian Law Corpus             |
| Infra          | Custom hosting, edge-optimized processing     |


---

> **EquiCourt** is committed to redefining justice for the digital age — one dispute at a time.

