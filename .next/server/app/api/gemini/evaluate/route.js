/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/gemini/evaluate/route";
exports.ids = ["app/api/gemini/evaluate/route"];
exports.modules = {

/***/ "(rsc)/./app/api/gemini/evaluate/route.ts":
/*!******************************************!*\
  !*** ./app/api/gemini/evaluate/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_gemini_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/gemini.server */ \"(rsc)/./lib/gemini.server.ts\");\n\n\nasync function POST(req) {\n    try {\n        const { question, correctAnswer, userAnswer } = await req.json();\n        if (!question || !correctAnswer || !userAnswer) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Missing parameters\"\n        }, {\n            status: 400\n        });\n        const result = await (0,_lib_gemini_server__WEBPACK_IMPORTED_MODULE_1__.evaluateAnswer)(question, correctAnswer, userAnswer);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(result);\n    } catch (err) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: err.message || \"Server error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2dlbWluaS9ldmFsdWF0ZS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBMkM7QUFDVTtBQUU5QyxlQUFlRSxLQUFLQyxHQUFZO0lBQ3JDLElBQUk7UUFDRixNQUFNLEVBQUVDLFFBQVEsRUFBRUMsYUFBYSxFQUFFQyxVQUFVLEVBQUUsR0FBRyxNQUFNSCxJQUFJSSxJQUFJO1FBQzlELElBQUksQ0FBQ0gsWUFBWSxDQUFDQyxpQkFBaUIsQ0FBQ0MsWUFDbEMsT0FBT04scURBQVlBLENBQUNPLElBQUksQ0FDdEI7WUFBRUMsT0FBTztRQUFxQixHQUM5QjtZQUFFQyxRQUFRO1FBQUk7UUFHbEIsTUFBTUMsU0FBUyxNQUFNVCxrRUFBY0EsQ0FBQ0csVUFBVUMsZUFBZUM7UUFDN0QsT0FBT04scURBQVlBLENBQUNPLElBQUksQ0FBQ0c7SUFDM0IsRUFBRSxPQUFPQyxLQUFVO1FBQ2pCLE9BQU9YLHFEQUFZQSxDQUFDTyxJQUFJLENBQ3RCO1lBQUVDLE9BQU9HLElBQUlDLE9BQU8sSUFBSTtRQUFlLEdBQ3ZDO1lBQUVILFFBQVE7UUFBSTtJQUVsQjtBQUNGIiwic291cmNlcyI6WyIvaG9tZS9nb2JpbGkvcmVwb3MvQ29nbml0aXZlLVJldmlzaW9uLUVuZ2luZS9hcHAvYXBpL2dlbWluaS9ldmFsdWF0ZS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB7IGV2YWx1YXRlQW5zd2VyIH0gZnJvbSBcIkAvbGliL2dlbWluaS5zZXJ2ZXJcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxOiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBxdWVzdGlvbiwgY29ycmVjdEFuc3dlciwgdXNlckFuc3dlciB9ID0gYXdhaXQgcmVxLmpzb24oKTtcbiAgICBpZiAoIXF1ZXN0aW9uIHx8ICFjb3JyZWN0QW5zd2VyIHx8ICF1c2VyQW5zd2VyKVxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgICB7IGVycm9yOiBcIk1pc3NpbmcgcGFyYW1ldGVyc1wiIH0sXG4gICAgICAgIHsgc3RhdHVzOiA0MDAgfVxuICAgICAgKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV2YWx1YXRlQW5zd2VyKHF1ZXN0aW9uLCBjb3JyZWN0QW5zd2VyLCB1c2VyQW5zd2VyKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24ocmVzdWx0KTtcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IGVycm9yOiBlcnIubWVzc2FnZSB8fCBcIlNlcnZlciBlcnJvclwiIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH1cbiAgICApO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiZXZhbHVhdGVBbnN3ZXIiLCJQT1NUIiwicmVxIiwicXVlc3Rpb24iLCJjb3JyZWN0QW5zd2VyIiwidXNlckFuc3dlciIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsInJlc3VsdCIsImVyciIsIm1lc3NhZ2UiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/gemini/evaluate/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/gemini.server.ts":
/*!******************************!*\
  !*** ./lib/gemini.server.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   askCardClarification: () => (/* binding */ askCardClarification),\n/* harmony export */   evaluateAnswer: () => (/* binding */ evaluateAnswer),\n/* harmony export */   generateCurriculum: () => (/* binding */ generateCurriculum),\n/* harmony export */   generateDeckFromTopic: () => (/* binding */ generateDeckFromTopic)\n/* harmony export */ });\n/* harmony import */ var _google_genai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @google/genai */ \"(rsc)/./node_modules/@google/genai/dist/node/index.mjs\");\n\n// Lazy getter to avoid throwing at module import time. Throws when called if not configured.\nconst getAI = ()=>{\n    const apiKey = process.env.GEMINI_API_KEY;\n    if (!apiKey) throw new Error(\"GEMINI_API_KEY environment variable is required\");\n    return new _google_genai__WEBPACK_IMPORTED_MODULE_0__.GoogleGenAI({\n        apiKey\n    });\n};\nconst generateCurriculum = async (topic)=>{\n    const ai = getAI();\n    const response = await ai.models.generateContent({\n        model: \"gemini-3-flash-preview\",\n        contents: `You are an expert curriculum designer. Break down the topic \"${topic}\" into 4-6 logical, ordered subtopics for a student. Start from fundamentals and move to more advanced concepts. Return a JSON list of subtopics, each with a title and a brief 1-sentence description.`,\n        config: {\n            responseMimeType: \"application/json\",\n            responseSchema: {\n                type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.OBJECT,\n                properties: {\n                    subtopics: {\n                        type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.ARRAY,\n                        items: {\n                            type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.OBJECT,\n                            properties: {\n                                title: {\n                                    type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.STRING\n                                },\n                                description: {\n                                    type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.STRING\n                                }\n                            },\n                            required: [\n                                \"title\",\n                                \"description\"\n                            ]\n                        }\n                    }\n                },\n                required: [\n                    \"subtopics\"\n                ]\n            }\n        }\n    });\n    const text = response.text;\n    if (!text) throw new Error(\"No response from AI\");\n    const data = JSON.parse(text);\n    return data.subtopics;\n};\nconst generateDeckFromTopic = async (subtopic, parentTopic)=>{\n    const ai = getAI();\n    const prompt = `Create a high-quality \"Atomic\" flashcard deck for the subtopic: \"${subtopic}\". Context: This is part of a course on \"${parentTopic}\".\\n\\nSRS DESIGN PRINCIPLES (MUST FOLLOW):\\n1. ATOMICITY: Each card must test exactly ONE discrete fact or concept. Do not include lists or multiple steps on one card.\\n2. CLARITY: The \\\"Front\\\" should be a precise trigger (Question, Definition, or Fill-in-the-blank).\\n3. BREVITY: The \\\"Back\\\" should be a short, \\\"punchy\\\" answer that can be verified in < 2 seconds.\\n4. ACTIVE RECALL: Avoid \\\"True/False\\\" or \\\"Multiple Choice\\\" styles. Use \\\"What is...\\\", \\\"How does...\\\", \\\"Define...\\\".\\n\\nGenerate 6-10 cards. Return a JSON object with a specific title for this deck and the list of cards.`;\n    const response = await ai.models.generateContent({\n        model: \"gemini-3-flash-preview\",\n        contents: prompt,\n        config: {\n            responseMimeType: \"application/json\",\n            responseSchema: {\n                type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.OBJECT,\n                properties: {\n                    title: {\n                        type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.STRING\n                    },\n                    cards: {\n                        type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.ARRAY,\n                        items: {\n                            type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.OBJECT,\n                            properties: {\n                                front: {\n                                    type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.STRING\n                                },\n                                back: {\n                                    type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.STRING\n                                }\n                            },\n                            required: [\n                                \"front\",\n                                \"back\"\n                            ]\n                        }\n                    }\n                },\n                required: [\n                    \"title\",\n                    \"cards\"\n                ]\n            }\n        }\n    });\n    const text = response.text;\n    if (!text) throw new Error(\"No response from AI\");\n    return JSON.parse(text);\n};\nconst askCardClarification = async (question, cardFront, cardBack, history)=>{\n    const ai = getAI();\n    const systemContext = `You are a helpful and encouraging tutor. The student is reviewing a flashcard. [Flashcard Question]: \"${cardFront}\" [Flashcard Answer]: \"${cardBack}\" The student has a question about this card or answer. Answer clearly and concisely. If they ask something unrelated, politely steer them back to the card's topic.`;\n    let promptHistory = \"\";\n    history.forEach((msg)=>{\n        promptHistory += `${msg.role === \"user\" ? \"Student\" : \"Tutor\"}: ${msg.text}\\n`;\n    });\n    const fullPrompt = `${systemContext}\\n\\n${promptHistory}Student: ${question}\\nTutor:`;\n    const response = await ai.models.generateContent({\n        model: \"gemini-3-flash-preview\",\n        contents: fullPrompt\n    });\n    const text = response.text;\n    if (!text) throw new Error(\"No response from AI\");\n    return text;\n};\nconst evaluateAnswer = async (question, correctAnswer, userAnswer)=>{\n    const ai = getAI();\n    const prompt = `You are a strict but fair flashcard grader. Question: \"${question}\" Correct Answer: \"${correctAnswer}\" Student Answer: \"${userAnswer}\"\\n\\nRate the student's answer on a scale of 1-4 and provide a brief feedback. Return JSON.`;\n    const response = await ai.models.generateContent({\n        model: \"gemini-3-flash-preview\",\n        contents: prompt,\n        config: {\n            responseMimeType: \"application/json\",\n            responseSchema: {\n                type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.OBJECT,\n                properties: {\n                    score: {\n                        type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.INTEGER\n                    },\n                    feedback: {\n                        type: _google_genai__WEBPACK_IMPORTED_MODULE_0__.Type.STRING\n                    }\n                },\n                required: [\n                    \"score\",\n                    \"feedback\"\n                ]\n            }\n        }\n    });\n    const text = response.text;\n    if (!text) throw new Error(\"No response from AI\");\n    return JSON.parse(text);\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFNLElBQUl0QixNQUFNO0lBQzNCLE9BQU93QixLQUFLQyxLQUFLLENBQUNIO0FBQ3BCLEVBQUUiLCJzb3VyY2VzIjpbIi9ob21lL2dvYmlsaS9yZXBvcy9Db2duaXRpdmUtUmV2aXNpb24tRW5naW5lL2xpYi9nZW1pbmkuc2VydmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdvb2dsZUdlbkFJLCBUeXBlIH0gZnJvbSBcIkBnb29nbGUvZ2VuYWlcIjtcbmltcG9ydCB7IEZsYXNoY2FyZERhdGEgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vLyBMYXp5IGdldHRlciB0byBhdm9pZCB0aHJvd2luZyBhdCBtb2R1bGUgaW1wb3J0IHRpbWUuIFRocm93cyB3aGVuIGNhbGxlZCBpZiBub3QgY29uZmlndXJlZC5cbmNvbnN0IGdldEFJID0gKCkgPT4ge1xuICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWTtcbiAgaWYgKCFhcGlLZXkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiR0VNSU5JX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgcmVxdWlyZWRcIik7XG4gIHJldHVybiBuZXcgR29vZ2xlR2VuQUkoeyBhcGlLZXkgfSk7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnRvcGljU3VnZ2VzdGlvbiB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBnZW5lcmF0ZUN1cnJpY3VsdW0gPSBhc3luYyAoXG4gIHRvcGljOiBzdHJpbmdcbik6IFByb21pc2U8U3VidG9waWNTdWdnZXN0aW9uW10+ID0+IHtcbiAgY29uc3QgYWkgPSBnZXRBSSgpO1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFpLm1vZGVscy5nZW5lcmF0ZUNvbnRlbnQoe1xuICAgIG1vZGVsOiBcImdlbWluaS0zLWZsYXNoLXByZXZpZXdcIixcbiAgICBjb250ZW50czogYFlvdSBhcmUgYW4gZXhwZXJ0IGN1cnJpY3VsdW0gZGVzaWduZXIuIEJyZWFrIGRvd24gdGhlIHRvcGljIFwiJHt0b3BpY31cIiBpbnRvIDQtNiBsb2dpY2FsLCBvcmRlcmVkIHN1YnRvcGljcyBmb3IgYSBzdHVkZW50LiBTdGFydCBmcm9tIGZ1bmRhbWVudGFscyBhbmQgbW92ZSB0byBtb3JlIGFkdmFuY2VkIGNvbmNlcHRzLiBSZXR1cm4gYSBKU09OIGxpc3Qgb2Ygc3VidG9waWNzLCBlYWNoIHdpdGggYSB0aXRsZSBhbmQgYSBicmllZiAxLXNlbnRlbmNlIGRlc2NyaXB0aW9uLmAsXG4gICAgY29uZmlnOiB7XG4gICAgICByZXNwb25zZU1pbWVUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIHJlc3BvbnNlU2NoZW1hOiB7XG4gICAgICAgIHR5cGU6IFR5cGUuT0JKRUNULFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc3VidG9waWNzOiB7XG4gICAgICAgICAgICB0eXBlOiBUeXBlLkFSUkFZLFxuICAgICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgICAgdHlwZTogVHlwZS5PQkpFQ1QsXG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogeyB0eXBlOiBUeXBlLlNUUklORyB9LFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6IFR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ0aXRsZVwiLCBcImRlc2NyaXB0aW9uXCJdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW1wic3VidG9waWNzXCJdLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCB0ZXh0ID0gcmVzcG9uc2UudGV4dDtcbiAgaWYgKCF0ZXh0KSB0aHJvdyBuZXcgRXJyb3IoXCJObyByZXNwb25zZSBmcm9tIEFJXCIpO1xuICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZSh0ZXh0KTtcbiAgcmV0dXJuIGRhdGEuc3VidG9waWNzO1xufTtcblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlRGVja0Zyb21Ub3BpYyA9IGFzeW5jIChcbiAgc3VidG9waWM6IHN0cmluZyxcbiAgcGFyZW50VG9waWM6IHN0cmluZ1xuKSA9PiB7XG4gIGNvbnN0IGFpID0gZ2V0QUkoKTtcbiAgY29uc3QgcHJvbXB0ID0gYENyZWF0ZSBhIGhpZ2gtcXVhbGl0eSBcIkF0b21pY1wiIGZsYXNoY2FyZCBkZWNrIGZvciB0aGUgc3VidG9waWM6IFwiJHtzdWJ0b3BpY31cIi4gQ29udGV4dDogVGhpcyBpcyBwYXJ0IG9mIGEgY291cnNlIG9uIFwiJHtwYXJlbnRUb3BpY31cIi5cXG5cXG5TUlMgREVTSUdOIFBSSU5DSVBMRVMgKE1VU1QgRk9MTE9XKTpcXG4xLiBBVE9NSUNJVFk6IEVhY2ggY2FyZCBtdXN0IHRlc3QgZXhhY3RseSBPTkUgZGlzY3JldGUgZmFjdCBvciBjb25jZXB0LiBEbyBub3QgaW5jbHVkZSBsaXN0cyBvciBtdWx0aXBsZSBzdGVwcyBvbiBvbmUgY2FyZC5cXG4yLiBDTEFSSVRZOiBUaGUgXFxcIkZyb250XFxcIiBzaG91bGQgYmUgYSBwcmVjaXNlIHRyaWdnZXIgKFF1ZXN0aW9uLCBEZWZpbml0aW9uLCBvciBGaWxsLWluLXRoZS1ibGFuaykuXFxuMy4gQlJFVklUWTogVGhlIFxcXCJCYWNrXFxcIiBzaG91bGQgYmUgYSBzaG9ydCwgXFxcInB1bmNoeVxcXCIgYW5zd2VyIHRoYXQgY2FuIGJlIHZlcmlmaWVkIGluIDwgMiBzZWNvbmRzLlxcbjQuIEFDVElWRSBSRUNBTEw6IEF2b2lkIFxcXCJUcnVlL0ZhbHNlXFxcIiBvciBcXFwiTXVsdGlwbGUgQ2hvaWNlXFxcIiBzdHlsZXMuIFVzZSBcXFwiV2hhdCBpcy4uLlxcXCIsIFxcXCJIb3cgZG9lcy4uLlxcXCIsIFxcXCJEZWZpbmUuLi5cXFwiLlxcblxcbkdlbmVyYXRlIDYtMTAgY2FyZHMuIFJldHVybiBhIEpTT04gb2JqZWN0IHdpdGggYSBzcGVjaWZpYyB0aXRsZSBmb3IgdGhpcyBkZWNrIGFuZCB0aGUgbGlzdCBvZiBjYXJkcy5gO1xuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYWkubW9kZWxzLmdlbmVyYXRlQ29udGVudCh7XG4gICAgbW9kZWw6IFwiZ2VtaW5pLTMtZmxhc2gtcHJldmlld1wiLFxuICAgIGNvbnRlbnRzOiBwcm9tcHQsXG4gICAgY29uZmlnOiB7XG4gICAgICByZXNwb25zZU1pbWVUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIHJlc3BvbnNlU2NoZW1hOiB7XG4gICAgICAgIHR5cGU6IFR5cGUuT0JKRUNULFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGl0bGU6IHsgdHlwZTogVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBjYXJkczoge1xuICAgICAgICAgICAgdHlwZTogVHlwZS5BUlJBWSxcbiAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgIHR5cGU6IFR5cGUuT0JKRUNULFxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgZnJvbnQ6IHsgdHlwZTogVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgICAgICBiYWNrOiB7IHR5cGU6IFR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJmcm9udFwiLCBcImJhY2tcIl0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXCJ0aXRsZVwiLCBcImNhcmRzXCJdLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCB0ZXh0ID0gcmVzcG9uc2UudGV4dDtcbiAgaWYgKCF0ZXh0KSB0aHJvdyBuZXcgRXJyb3IoXCJObyByZXNwb25zZSBmcm9tIEFJXCIpO1xuICByZXR1cm4gSlNPTi5wYXJzZSh0ZXh0KTtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhdE1lc3NhZ2Uge1xuICByb2xlOiBcInVzZXJcIiB8IFwibW9kZWxcIjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgYXNrQ2FyZENsYXJpZmljYXRpb24gPSBhc3luYyAoXG4gIHF1ZXN0aW9uOiBzdHJpbmcsXG4gIGNhcmRGcm9udDogc3RyaW5nLFxuICBjYXJkQmFjazogc3RyaW5nLFxuICBoaXN0b3J5OiBDaGF0TWVzc2FnZVtdXG4pOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICBjb25zdCBhaSA9IGdldEFJKCk7XG4gIGNvbnN0IHN5c3RlbUNvbnRleHQgPSBgWW91IGFyZSBhIGhlbHBmdWwgYW5kIGVuY291cmFnaW5nIHR1dG9yLiBUaGUgc3R1ZGVudCBpcyByZXZpZXdpbmcgYSBmbGFzaGNhcmQuIFtGbGFzaGNhcmQgUXVlc3Rpb25dOiBcIiR7Y2FyZEZyb250fVwiIFtGbGFzaGNhcmQgQW5zd2VyXTogXCIke2NhcmRCYWNrfVwiIFRoZSBzdHVkZW50IGhhcyBhIHF1ZXN0aW9uIGFib3V0IHRoaXMgY2FyZCBvciBhbnN3ZXIuIEFuc3dlciBjbGVhcmx5IGFuZCBjb25jaXNlbHkuIElmIHRoZXkgYXNrIHNvbWV0aGluZyB1bnJlbGF0ZWQsIHBvbGl0ZWx5IHN0ZWVyIHRoZW0gYmFjayB0byB0aGUgY2FyZCdzIHRvcGljLmA7XG5cbiAgbGV0IHByb21wdEhpc3RvcnkgPSBcIlwiO1xuICBoaXN0b3J5LmZvckVhY2goKG1zZykgPT4ge1xuICAgIHByb21wdEhpc3RvcnkgKz0gYCR7bXNnLnJvbGUgPT09IFwidXNlclwiID8gXCJTdHVkZW50XCIgOiBcIlR1dG9yXCJ9OiAke1xuICAgICAgbXNnLnRleHRcbiAgICB9XFxuYDtcbiAgfSk7XG5cbiAgY29uc3QgZnVsbFByb21wdCA9IGAke3N5c3RlbUNvbnRleHR9XFxuXFxuJHtwcm9tcHRIaXN0b3J5fVN0dWRlbnQ6ICR7cXVlc3Rpb259XFxuVHV0b3I6YDtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFpLm1vZGVscy5nZW5lcmF0ZUNvbnRlbnQoe1xuICAgIG1vZGVsOiBcImdlbWluaS0zLWZsYXNoLXByZXZpZXdcIixcbiAgICBjb250ZW50czogZnVsbFByb21wdCxcbiAgfSk7XG5cbiAgY29uc3QgdGV4dCA9IHJlc3BvbnNlLnRleHQ7XG4gIGlmICghdGV4dCkgdGhyb3cgbmV3IEVycm9yKFwiTm8gcmVzcG9uc2UgZnJvbSBBSVwiKTtcbiAgcmV0dXJuIHRleHQ7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIEdyYWRpbmdSZXN1bHQge1xuICBzY29yZTogbnVtYmVyOyAvLyAxLTRcbiAgZmVlZGJhY2s6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGV2YWx1YXRlQW5zd2VyID0gYXN5bmMgKFxuICBxdWVzdGlvbjogc3RyaW5nLFxuICBjb3JyZWN0QW5zd2VyOiBzdHJpbmcsXG4gIHVzZXJBbnN3ZXI6IHN0cmluZ1xuKTogUHJvbWlzZTxHcmFkaW5nUmVzdWx0PiA9PiB7XG4gIGNvbnN0IGFpID0gZ2V0QUkoKTtcbiAgY29uc3QgcHJvbXB0ID0gYFlvdSBhcmUgYSBzdHJpY3QgYnV0IGZhaXIgZmxhc2hjYXJkIGdyYWRlci4gUXVlc3Rpb246IFwiJHtxdWVzdGlvbn1cIiBDb3JyZWN0IEFuc3dlcjogXCIke2NvcnJlY3RBbnN3ZXJ9XCIgU3R1ZGVudCBBbnN3ZXI6IFwiJHt1c2VyQW5zd2VyfVwiXFxuXFxuUmF0ZSB0aGUgc3R1ZGVudCdzIGFuc3dlciBvbiBhIHNjYWxlIG9mIDEtNCBhbmQgcHJvdmlkZSBhIGJyaWVmIGZlZWRiYWNrLiBSZXR1cm4gSlNPTi5gO1xuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYWkubW9kZWxzLmdlbmVyYXRlQ29udGVudCh7XG4gICAgbW9kZWw6IFwiZ2VtaW5pLTMtZmxhc2gtcHJldmlld1wiLFxuICAgIGNvbnRlbnRzOiBwcm9tcHQsXG4gICAgY29uZmlnOiB7XG4gICAgICByZXNwb25zZU1pbWVUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIHJlc3BvbnNlU2NoZW1hOiB7XG4gICAgICAgIHR5cGU6IFR5cGUuT0JKRUNULFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc2NvcmU6IHsgdHlwZTogVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgZmVlZGJhY2s6IHsgdHlwZTogVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtcInNjb3JlXCIsIFwiZmVlZGJhY2tcIl0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHRleHQgPSByZXNwb25zZS50ZXh0O1xuICBpZiAoIXRleHQpIHRocm93IG5ldyBFcnJvcihcIk5vIHJlc3BvbnNlIGZyb20gQUlcIik7XG4gIHJldHVybiBKU09OLnBhcnNlKHRleHQpO1xufTtcbiJdLCJuYW1lcyI6WyJHb29nbGVHZW5BSSIsIlR5cGUiLCJnZXRBSSIsImFwaUtleSIsInByb2Nlc3MiLCJlbnYiLCJHRU1JTklfQVBJX0tFWSIsIkVycm9yIiwiZ2VuZXJhdGVDdXJyaWN1bHVtIiwidG9waWMiLCJhaSIsInJlc3BvbnNlIiwibW9kZWxzIiwiZ2VuZXJhdGVDb250ZW50IiwibW9kZWwiLCJjb250ZW50cyIsImNvbmZpZyIsInJlc3BvbnNlTWltZVR5cGUiLCJyZXNwb25zZVNjaGVtYSIsInR5cGUiLCJPQkpFQ1QiLCJwcm9wZXJ0aWVzIiwic3VidG9waWNzIiwiQVJSQVkiLCJpdGVtcyIsInRpdGxlIiwiU1RSSU5HIiwiZGVzY3JpcHRpb24iLCJyZXF1aXJlZCIsInRleHQiLCJkYXRhIiwiSlNPTiIsInBhcnNlIiwiZ2VuZXJhdGVEZWNrRnJvbVRvcGljIiwic3VidG9waWMiLCJwYXJlbnRUb3BpYyIsInByb21wdCIsImNhcmRzIiwiZnJvbnQiLCJiYWNrIiwiYXNrQ2FyZENsYXJpZmljYXRpb24iLCJxdWVzdGlvbiIsImNhcmRGcm9udCIsImNhcmRCYWNrIiwiaGlzdG9yeSIsInN5c3RlbUNvbnRleHQiLCJwcm9tcHRIaXN0b3J5IiwiZm9yRWFjaCIsIm1zZyIsInJvbGUiLCJmdWxsUHJvbXB0IiwiZXZhbHVhdGVBbnN3ZXIiLCJjb3JyZWN0QW5zd2VyIiwidXNlckFuc3dlciIsInNjb3JlIiwiSU5URUdFUiIsImZlZWRiYWNrIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/gemini.server.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgemini%2Fevaluate%2Froute&page=%2Fapi%2Fgemini%2Fevaluate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgemini%2Fevaluate%2Froute.ts&appDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgemini%2Fevaluate%2Froute&page=%2Fapi%2Fgemini%2Fevaluate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgemini%2Fevaluate%2Froute.ts&appDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   handler: () => (/* binding */ handler),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/dist/server/request-meta */ \"(rsc)/./node_modules/next/dist/server/request-meta.js\");\n/* harmony import */ var next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var next_dist_server_lib_trace_tracer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! next/dist/server/lib/trace/tracer */ \"(rsc)/./node_modules/next/dist/server/lib/trace/tracer.js\");\n/* harmony import */ var next_dist_server_lib_trace_tracer__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_trace_tracer__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var next_dist_shared_lib_router_utils_app_paths__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! next/dist/shared/lib/router/utils/app-paths */ \"next/dist/shared/lib/router/utils/app-paths\");\n/* harmony import */ var next_dist_shared_lib_router_utils_app_paths__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(next_dist_shared_lib_router_utils_app_paths__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var next_dist_server_base_http_node__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! next/dist/server/base-http/node */ \"(rsc)/./node_modules/next/dist/server/base-http/node.js\");\n/* harmony import */ var next_dist_server_base_http_node__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_base_http_node__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var next_dist_server_web_spec_extension_adapters_next_request__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! next/dist/server/web/spec-extension/adapters/next-request */ \"(rsc)/./node_modules/next/dist/server/web/spec-extension/adapters/next-request.js\");\n/* harmony import */ var next_dist_server_web_spec_extension_adapters_next_request__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_spec_extension_adapters_next_request__WEBPACK_IMPORTED_MODULE_7__);\n/* harmony import */ var next_dist_server_lib_trace_constants__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! next/dist/server/lib/trace/constants */ \"(rsc)/./node_modules/next/dist/server/lib/trace/constants.js\");\n/* harmony import */ var next_dist_server_lib_trace_constants__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_trace_constants__WEBPACK_IMPORTED_MODULE_8__);\n/* harmony import */ var next_dist_server_instrumentation_utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! next/dist/server/instrumentation/utils */ \"(rsc)/./node_modules/next/dist/server/instrumentation/utils.js\");\n/* harmony import */ var next_dist_server_send_response__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! next/dist/server/send-response */ \"(rsc)/./node_modules/next/dist/server/send-response.js\");\n/* harmony import */ var next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! next/dist/server/web/utils */ \"(rsc)/./node_modules/next/dist/server/web/utils.js\");\n/* harmony import */ var next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_11__);\n/* harmony import */ var next_dist_server_lib_cache_control__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! next/dist/server/lib/cache-control */ \"(rsc)/./node_modules/next/dist/server/lib/cache-control.js\");\n/* harmony import */ var next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! next/dist/lib/constants */ \"(rsc)/./node_modules/next/dist/lib/constants.js\");\n/* harmony import */ var next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13__);\n/* harmony import */ var next_dist_shared_lib_no_fallback_error_external__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! next/dist/shared/lib/no-fallback-error.external */ \"next/dist/shared/lib/no-fallback-error.external\");\n/* harmony import */ var next_dist_shared_lib_no_fallback_error_external__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(next_dist_shared_lib_no_fallback_error_external__WEBPACK_IMPORTED_MODULE_14__);\n/* harmony import */ var next_dist_server_response_cache__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! next/dist/server/response-cache */ \"(rsc)/./node_modules/next/dist/server/response-cache/index.js\");\n/* harmony import */ var next_dist_server_response_cache__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_response_cache__WEBPACK_IMPORTED_MODULE_15__);\n/* harmony import */ var _home_gobili_repos_Cognitive_Revision_Engine_app_api_gemini_evaluate_route_ts__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./app/api/gemini/evaluate/route.ts */ \"(rsc)/./app/api/gemini/evaluate/route.ts\");\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/gemini/evaluate/route\",\n        pathname: \"/api/gemini/evaluate\",\n        filename: \"route\",\n        bundlePath: \"app/api/gemini/evaluate/route\"\n    },\n    distDir: \".next\" || 0,\n    relativeProjectDir:  false || '',\n    resolvedPagePath: \"/home/gobili/repos/Cognitive-Revision-Engine/app/api/gemini/evaluate/route.ts\",\n    nextConfigOutput,\n    userland: _home_gobili_repos_Cognitive_Revision_Engine_app_api_gemini_evaluate_route_ts__WEBPACK_IMPORTED_MODULE_16__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\nasync function handler(req, res, ctx) {\n    var _nextConfig_experimental;\n    let srcPage = \"/api/gemini/evaluate/route\";\n    // turbopack doesn't normalize `/index` in the page name\n    // so we need to to process dynamic routes properly\n    // TODO: fix turbopack providing differing value from webpack\n    if (false) {} else if (srcPage === '/index') {\n        // we always normalize /index specifically\n        srcPage = '/';\n    }\n    const multiZoneDraftMode = false;\n    const prepareResult = await routeModule.prepare(req, res, {\n        srcPage,\n        multiZoneDraftMode\n    });\n    if (!prepareResult) {\n        res.statusCode = 400;\n        res.end('Bad Request');\n        ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());\n        return null;\n    }\n    const { buildId, params, nextConfig, isDraftMode, prerenderManifest, routerServerContext, isOnDemandRevalidate, revalidateOnlyGenerated, resolvedPathname } = prepareResult;\n    const normalizedSrcPage = (0,next_dist_shared_lib_router_utils_app_paths__WEBPACK_IMPORTED_MODULE_5__.normalizeAppPath)(srcPage);\n    let isIsr = Boolean(prerenderManifest.dynamicRoutes[normalizedSrcPage] || prerenderManifest.routes[resolvedPathname]);\n    if (isIsr && !isDraftMode) {\n        const isPrerendered = Boolean(prerenderManifest.routes[resolvedPathname]);\n        const prerenderInfo = prerenderManifest.dynamicRoutes[normalizedSrcPage];\n        if (prerenderInfo) {\n            if (prerenderInfo.fallback === false && !isPrerendered) {\n                throw new next_dist_shared_lib_no_fallback_error_external__WEBPACK_IMPORTED_MODULE_14__.NoFallbackError();\n            }\n        }\n    }\n    let cacheKey = null;\n    if (isIsr && !routeModule.isDev && !isDraftMode) {\n        cacheKey = resolvedPathname;\n        // ensure /index and / is normalized to one key\n        cacheKey = cacheKey === '/index' ? '/' : cacheKey;\n    }\n    const supportsDynamicResponse = // If we're in development, we always support dynamic HTML\n    routeModule.isDev === true || // If this is not SSG or does not have static paths, then it supports\n    // dynamic HTML.\n    !isIsr;\n    // This is a revalidation request if the request is for a static\n    // page and it is not being resumed from a postponed render and\n    // it is not a dynamic RSC request then it is a revalidation\n    // request.\n    const isRevalidate = isIsr && !supportsDynamicResponse;\n    const method = req.method || 'GET';\n    const tracer = (0,next_dist_server_lib_trace_tracer__WEBPACK_IMPORTED_MODULE_4__.getTracer)();\n    const activeSpan = tracer.getActiveScopeSpan();\n    const context = {\n        params,\n        prerenderManifest,\n        renderOpts: {\n            experimental: {\n                cacheComponents: Boolean(nextConfig.experimental.cacheComponents),\n                authInterrupts: Boolean(nextConfig.experimental.authInterrupts)\n            },\n            supportsDynamicResponse,\n            incrementalCache: (0,next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3__.getRequestMeta)(req, 'incrementalCache'),\n            cacheLifeProfiles: (_nextConfig_experimental = nextConfig.experimental) == null ? void 0 : _nextConfig_experimental.cacheLife,\n            isRevalidate,\n            waitUntil: ctx.waitUntil,\n            onClose: (cb)=>{\n                res.on('close', cb);\n            },\n            onAfterTaskError: undefined,\n            onInstrumentationRequestError: (error, _request, errorContext)=>routeModule.onRequestError(req, error, errorContext, routerServerContext)\n        },\n        sharedContext: {\n            buildId\n        }\n    };\n    const nodeNextReq = new next_dist_server_base_http_node__WEBPACK_IMPORTED_MODULE_6__.NodeNextRequest(req);\n    const nodeNextRes = new next_dist_server_base_http_node__WEBPACK_IMPORTED_MODULE_6__.NodeNextResponse(res);\n    const nextReq = next_dist_server_web_spec_extension_adapters_next_request__WEBPACK_IMPORTED_MODULE_7__.NextRequestAdapter.fromNodeNextRequest(nodeNextReq, (0,next_dist_server_web_spec_extension_adapters_next_request__WEBPACK_IMPORTED_MODULE_7__.signalFromNodeResponse)(res));\n    try {\n        const invokeRouteModule = async (span)=>{\n            return routeModule.handle(nextReq, context).finally(()=>{\n                if (!span) return;\n                span.setAttributes({\n                    'http.status_code': res.statusCode,\n                    'next.rsc': false\n                });\n                const rootSpanAttributes = tracer.getRootSpanAttributes();\n                // We were unable to get attributes, probably OTEL is not enabled\n                if (!rootSpanAttributes) {\n                    return;\n                }\n                if (rootSpanAttributes.get('next.span_type') !== next_dist_server_lib_trace_constants__WEBPACK_IMPORTED_MODULE_8__.BaseServerSpan.handleRequest) {\n                    console.warn(`Unexpected root span type '${rootSpanAttributes.get('next.span_type')}'. Please report this Next.js issue https://github.com/vercel/next.js`);\n                    return;\n                }\n                const route = rootSpanAttributes.get('next.route');\n                if (route) {\n                    const name = `${method} ${route}`;\n                    span.setAttributes({\n                        'next.route': route,\n                        'http.route': route,\n                        'next.span_name': name\n                    });\n                    span.updateName(name);\n                } else {\n                    span.updateName(`${method} ${req.url}`);\n                }\n            });\n        };\n        const handleResponse = async (currentSpan)=>{\n            var _cacheEntry_value;\n            const responseGenerator = async ({ previousCacheEntry })=>{\n                try {\n                    if (!(0,next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3__.getRequestMeta)(req, 'minimalMode') && isOnDemandRevalidate && revalidateOnlyGenerated && !previousCacheEntry) {\n                        res.statusCode = 404;\n                        // on-demand revalidate always sets this header\n                        res.setHeader('x-nextjs-cache', 'REVALIDATED');\n                        res.end('This page could not be found');\n                        return null;\n                    }\n                    const response = await invokeRouteModule(currentSpan);\n                    req.fetchMetrics = context.renderOpts.fetchMetrics;\n                    let pendingWaitUntil = context.renderOpts.pendingWaitUntil;\n                    // Attempt using provided waitUntil if available\n                    // if it's not we fallback to sendResponse's handling\n                    if (pendingWaitUntil) {\n                        if (ctx.waitUntil) {\n                            ctx.waitUntil(pendingWaitUntil);\n                            pendingWaitUntil = undefined;\n                        }\n                    }\n                    const cacheTags = context.renderOpts.collectedTags;\n                    // If the request is for a static response, we can cache it so long\n                    // as it's not edge.\n                    if (isIsr) {\n                        const blob = await response.blob();\n                        // Copy the headers from the response.\n                        const headers = (0,next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_11__.toNodeOutgoingHttpHeaders)(response.headers);\n                        if (cacheTags) {\n                            headers[next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13__.NEXT_CACHE_TAGS_HEADER] = cacheTags;\n                        }\n                        if (!headers['content-type'] && blob.type) {\n                            headers['content-type'] = blob.type;\n                        }\n                        const revalidate = typeof context.renderOpts.collectedRevalidate === 'undefined' || context.renderOpts.collectedRevalidate >= next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13__.INFINITE_CACHE ? false : context.renderOpts.collectedRevalidate;\n                        const expire = typeof context.renderOpts.collectedExpire === 'undefined' || context.renderOpts.collectedExpire >= next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13__.INFINITE_CACHE ? undefined : context.renderOpts.collectedExpire;\n                        // Create the cache entry for the response.\n                        const cacheEntry = {\n                            value: {\n                                kind: next_dist_server_response_cache__WEBPACK_IMPORTED_MODULE_15__.CachedRouteKind.APP_ROUTE,\n                                status: response.status,\n                                body: Buffer.from(await blob.arrayBuffer()),\n                                headers\n                            },\n                            cacheControl: {\n                                revalidate,\n                                expire\n                            }\n                        };\n                        return cacheEntry;\n                    } else {\n                        // send response without caching if not ISR\n                        await (0,next_dist_server_send_response__WEBPACK_IMPORTED_MODULE_10__.sendResponse)(nodeNextReq, nodeNextRes, response, context.renderOpts.pendingWaitUntil);\n                        return null;\n                    }\n                } catch (err) {\n                    // if this is a background revalidate we need to report\n                    // the request error here as it won't be bubbled\n                    if (previousCacheEntry == null ? void 0 : previousCacheEntry.isStale) {\n                        await routeModule.onRequestError(req, err, {\n                            routerKind: 'App Router',\n                            routePath: srcPage,\n                            routeType: 'route',\n                            revalidateReason: (0,next_dist_server_instrumentation_utils__WEBPACK_IMPORTED_MODULE_9__.getRevalidateReason)({\n                                isRevalidate,\n                                isOnDemandRevalidate\n                            })\n                        }, routerServerContext);\n                    }\n                    throw err;\n                }\n            };\n            const cacheEntry = await routeModule.handleResponse({\n                req,\n                nextConfig,\n                cacheKey,\n                routeKind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n                isFallback: false,\n                prerenderManifest,\n                isRoutePPREnabled: false,\n                isOnDemandRevalidate,\n                revalidateOnlyGenerated,\n                responseGenerator,\n                waitUntil: ctx.waitUntil\n            });\n            // we don't create a cacheEntry for ISR\n            if (!isIsr) {\n                return null;\n            }\n            if ((cacheEntry == null ? void 0 : (_cacheEntry_value = cacheEntry.value) == null ? void 0 : _cacheEntry_value.kind) !== next_dist_server_response_cache__WEBPACK_IMPORTED_MODULE_15__.CachedRouteKind.APP_ROUTE) {\n                var _cacheEntry_value1;\n                throw Object.defineProperty(new Error(`Invariant: app-route received invalid cache entry ${cacheEntry == null ? void 0 : (_cacheEntry_value1 = cacheEntry.value) == null ? void 0 : _cacheEntry_value1.kind}`), \"__NEXT_ERROR_CODE\", {\n                    value: \"E701\",\n                    enumerable: false,\n                    configurable: true\n                });\n            }\n            if (!(0,next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3__.getRequestMeta)(req, 'minimalMode')) {\n                res.setHeader('x-nextjs-cache', isOnDemandRevalidate ? 'REVALIDATED' : cacheEntry.isMiss ? 'MISS' : cacheEntry.isStale ? 'STALE' : 'HIT');\n            }\n            // Draft mode should never be cached\n            if (isDraftMode) {\n                res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');\n            }\n            const headers = (0,next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_11__.fromNodeOutgoingHttpHeaders)(cacheEntry.value.headers);\n            if (!((0,next_dist_server_request_meta__WEBPACK_IMPORTED_MODULE_3__.getRequestMeta)(req, 'minimalMode') && isIsr)) {\n                headers.delete(next_dist_lib_constants__WEBPACK_IMPORTED_MODULE_13__.NEXT_CACHE_TAGS_HEADER);\n            }\n            // If cache control is already set on the response we don't\n            // override it to allow users to customize it via next.config\n            if (cacheEntry.cacheControl && !res.getHeader('Cache-Control') && !headers.get('Cache-Control')) {\n                headers.set('Cache-Control', (0,next_dist_server_lib_cache_control__WEBPACK_IMPORTED_MODULE_12__.getCacheControlHeader)(cacheEntry.cacheControl));\n            }\n            await (0,next_dist_server_send_response__WEBPACK_IMPORTED_MODULE_10__.sendResponse)(nodeNextReq, nodeNextRes, new Response(cacheEntry.value.body, {\n                headers,\n                status: cacheEntry.value.status || 200\n            }));\n            return null;\n        };\n        // TODO: activeSpan code path is for when wrapped by\n        // next-server can be removed when this is no longer used\n        if (activeSpan) {\n            await handleResponse(activeSpan);\n        } else {\n            await tracer.withPropagatedContext(req.headers, ()=>tracer.trace(next_dist_server_lib_trace_constants__WEBPACK_IMPORTED_MODULE_8__.BaseServerSpan.handleRequest, {\n                    spanName: `${method} ${req.url}`,\n                    kind: next_dist_server_lib_trace_tracer__WEBPACK_IMPORTED_MODULE_4__.SpanKind.SERVER,\n                    attributes: {\n                        'http.method': method,\n                        'http.target': req.url\n                    }\n                }, handleResponse));\n        }\n    } catch (err) {\n        if (!(err instanceof next_dist_shared_lib_no_fallback_error_external__WEBPACK_IMPORTED_MODULE_14__.NoFallbackError)) {\n            await routeModule.onRequestError(req, err, {\n                routerKind: 'App Router',\n                routePath: normalizedSrcPage,\n                routeType: 'route',\n                revalidateReason: (0,next_dist_server_instrumentation_utils__WEBPACK_IMPORTED_MODULE_9__.getRevalidateReason)({\n                    isRevalidate,\n                    isOnDemandRevalidate\n                })\n            });\n        }\n        // rethrow so that we can handle serving error page\n        // If this is during static generation, throw the error again.\n        if (isIsr) throw err;\n        // Otherwise, send a 500 response.\n        await (0,next_dist_server_send_response__WEBPACK_IMPORTED_MODULE_10__.sendResponse)(nodeNextReq, nodeNextRes, new Response(null, {\n            status: 500\n        }));\n        return null;\n    }\n}\n\n//# sourceMappingURL=app-route.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZnZW1pbmklMkZldmFsdWF0ZSUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGZ2VtaW5pJTJGZXZhbHVhdGUlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZnZW1pbmklMkZldmFsdWF0ZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGZ29iaWxpJTJGcmVwb3MlMkZDb2duaXRpdmUtUmV2aXNpb24tRW5naW5lJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGZ29iaWxpJTJGcmVwb3MlMkZDb2duaXRpdmUtUmV2aXNpb24tRW5naW5lJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEJmlzR2xvYmFsTm90Rm91bmRFbmFibGVkPSEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDZDtBQUNTO0FBQ087QUFDSztBQUNtQztBQUNqRDtBQUNPO0FBQ2Y7QUFDc0M7QUFDekI7QUFDTTtBQUNDO0FBQ2hCO0FBQ3dDO0FBQzFHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLGFBQWEsT0FBb0MsSUFBSSxDQUFFO0FBQ3ZELHdCQUF3QixNQUF1QztBQUMvRDtBQUNBO0FBQ0Es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Q2xFO0FBQ0Esa0JBQWtCLDZFQUFZO0FBQzlCO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWLDZFQUE2RSxnRkFBYztBQUMzRixpQ0FBaUMsUUFBUSxFQUFFLFFBQVE7QUFDbkQsMEJBQTBCLHVFQUFRO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsTUFBTTtBQUNOLDZCQUE2Qiw2RkFBZTtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQywyRkFBbUI7QUFDckQ7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsNkVBQVk7QUFDMUI7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0IHsgZ2V0UmVxdWVzdE1ldGEgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yZXF1ZXN0LW1ldGFcIjtcbmltcG9ydCB7IGdldFRyYWNlciwgU3BhbktpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvdHJhY2UvdHJhY2VyXCI7XG5pbXBvcnQgeyBub3JtYWxpemVBcHBQYXRoIH0gZnJvbSBcIm5leHQvZGlzdC9zaGFyZWQvbGliL3JvdXRlci91dGlscy9hcHAtcGF0aHNcIjtcbmltcG9ydCB7IE5vZGVOZXh0UmVxdWVzdCwgTm9kZU5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Jhc2UtaHR0cC9ub2RlXCI7XG5pbXBvcnQgeyBOZXh0UmVxdWVzdEFkYXB0ZXIsIHNpZ25hbEZyb21Ob2RlUmVzcG9uc2UgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci93ZWIvc3BlYy1leHRlbnNpb24vYWRhcHRlcnMvbmV4dC1yZXF1ZXN0XCI7XG5pbXBvcnQgeyBCYXNlU2VydmVyU3BhbiB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi90cmFjZS9jb25zdGFudHNcIjtcbmltcG9ydCB7IGdldFJldmFsaWRhdGVSZWFzb24gfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9pbnN0cnVtZW50YXRpb24vdXRpbHNcIjtcbmltcG9ydCB7IHNlbmRSZXNwb25zZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3NlbmQtcmVzcG9uc2VcIjtcbmltcG9ydCB7IGZyb21Ob2RlT3V0Z29pbmdIdHRwSGVhZGVycywgdG9Ob2RlT3V0Z29pbmdIdHRwSGVhZGVycyB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3dlYi91dGlsc1wiO1xuaW1wb3J0IHsgZ2V0Q2FjaGVDb250cm9sSGVhZGVyIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL2NhY2hlLWNvbnRyb2xcIjtcbmltcG9ydCB7IElORklOSVRFX0NBQ0hFLCBORVhUX0NBQ0hFX1RBR1NfSEVBREVSIH0gZnJvbSBcIm5leHQvZGlzdC9saWIvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBOb0ZhbGxiYWNrRXJyb3IgfSBmcm9tIFwibmV4dC9kaXN0L3NoYXJlZC9saWIvbm8tZmFsbGJhY2stZXJyb3IuZXh0ZXJuYWxcIjtcbmltcG9ydCB7IENhY2hlZFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3Jlc3BvbnNlLWNhY2hlXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL2hvbWUvZ29iaWxpL3JlcG9zL0NvZ25pdGl2ZS1SZXZpc2lvbi1FbmdpbmUvYXBwL2FwaS9nZW1pbmkvZXZhbHVhdGUvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2dlbWluaS9ldmFsdWF0ZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2dlbWluaS9ldmFsdWF0ZVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvZ2VtaW5pL2V2YWx1YXRlL3JvdXRlXCJcbiAgICB9LFxuICAgIGRpc3REaXI6IHByb2Nlc3MuZW52Ll9fTkVYVF9SRUxBVElWRV9ESVNUX0RJUiB8fCAnJyxcbiAgICByZWxhdGl2ZVByb2plY3REaXI6IHByb2Nlc3MuZW52Ll9fTkVYVF9SRUxBVElWRV9QUk9KRUNUX0RJUiB8fCAnJyxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9ob21lL2dvYmlsaS9yZXBvcy9Db2duaXRpdmUtUmV2aXNpb24tRW5naW5lL2FwcC9hcGkvZ2VtaW5pL2V2YWx1YXRlL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMsIGN0eCkge1xuICAgIHZhciBfbmV4dENvbmZpZ19leHBlcmltZW50YWw7XG4gICAgbGV0IHNyY1BhZ2UgPSBcIi9hcGkvZ2VtaW5pL2V2YWx1YXRlL3JvdXRlXCI7XG4gICAgLy8gdHVyYm9wYWNrIGRvZXNuJ3Qgbm9ybWFsaXplIGAvaW5kZXhgIGluIHRoZSBwYWdlIG5hbWVcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIHRvIHByb2Nlc3MgZHluYW1pYyByb3V0ZXMgcHJvcGVybHlcbiAgICAvLyBUT0RPOiBmaXggdHVyYm9wYWNrIHByb3ZpZGluZyBkaWZmZXJpbmcgdmFsdWUgZnJvbSB3ZWJwYWNrXG4gICAgaWYgKHByb2Nlc3MuZW52LlRVUkJPUEFDSykge1xuICAgICAgICBzcmNQYWdlID0gc3JjUGFnZS5yZXBsYWNlKC9cXC9pbmRleCQvLCAnJykgfHwgJy8nO1xuICAgIH0gZWxzZSBpZiAoc3JjUGFnZSA9PT0gJy9pbmRleCcpIHtcbiAgICAgICAgLy8gd2UgYWx3YXlzIG5vcm1hbGl6ZSAvaW5kZXggc3BlY2lmaWNhbGx5XG4gICAgICAgIHNyY1BhZ2UgPSAnLyc7XG4gICAgfVxuICAgIGNvbnN0IG11bHRpWm9uZURyYWZ0TW9kZSA9IHByb2Nlc3MuZW52Ll9fTkVYVF9NVUxUSV9aT05FX0RSQUZUX01PREU7XG4gICAgY29uc3QgcHJlcGFyZVJlc3VsdCA9IGF3YWl0IHJvdXRlTW9kdWxlLnByZXBhcmUocmVxLCByZXMsIHtcbiAgICAgICAgc3JjUGFnZSxcbiAgICAgICAgbXVsdGlab25lRHJhZnRNb2RlXG4gICAgfSk7XG4gICAgaWYgKCFwcmVwYXJlUmVzdWx0KSB7XG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICByZXMuZW5kKCdCYWQgUmVxdWVzdCcpO1xuICAgICAgICBjdHgud2FpdFVudGlsID09IG51bGwgPyB2b2lkIDAgOiBjdHgud2FpdFVudGlsLmNhbGwoY3R4LCBQcm9taXNlLnJlc29sdmUoKSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCB7IGJ1aWxkSWQsIHBhcmFtcywgbmV4dENvbmZpZywgaXNEcmFmdE1vZGUsIHByZXJlbmRlck1hbmlmZXN0LCByb3V0ZXJTZXJ2ZXJDb250ZXh0LCBpc09uRGVtYW5kUmV2YWxpZGF0ZSwgcmV2YWxpZGF0ZU9ubHlHZW5lcmF0ZWQsIHJlc29sdmVkUGF0aG5hbWUgfSA9IHByZXBhcmVSZXN1bHQ7XG4gICAgY29uc3Qgbm9ybWFsaXplZFNyY1BhZ2UgPSBub3JtYWxpemVBcHBQYXRoKHNyY1BhZ2UpO1xuICAgIGxldCBpc0lzciA9IEJvb2xlYW4ocHJlcmVuZGVyTWFuaWZlc3QuZHluYW1pY1JvdXRlc1tub3JtYWxpemVkU3JjUGFnZV0gfHwgcHJlcmVuZGVyTWFuaWZlc3Qucm91dGVzW3Jlc29sdmVkUGF0aG5hbWVdKTtcbiAgICBpZiAoaXNJc3IgJiYgIWlzRHJhZnRNb2RlKSB7XG4gICAgICAgIGNvbnN0IGlzUHJlcmVuZGVyZWQgPSBCb29sZWFuKHByZXJlbmRlck1hbmlmZXN0LnJvdXRlc1tyZXNvbHZlZFBhdGhuYW1lXSk7XG4gICAgICAgIGNvbnN0IHByZXJlbmRlckluZm8gPSBwcmVyZW5kZXJNYW5pZmVzdC5keW5hbWljUm91dGVzW25vcm1hbGl6ZWRTcmNQYWdlXTtcbiAgICAgICAgaWYgKHByZXJlbmRlckluZm8pIHtcbiAgICAgICAgICAgIGlmIChwcmVyZW5kZXJJbmZvLmZhbGxiYWNrID09PSBmYWxzZSAmJiAhaXNQcmVyZW5kZXJlZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBOb0ZhbGxiYWNrRXJyb3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2FjaGVLZXkgPSBudWxsO1xuICAgIGlmIChpc0lzciAmJiAhcm91dGVNb2R1bGUuaXNEZXYgJiYgIWlzRHJhZnRNb2RlKSB7XG4gICAgICAgIGNhY2hlS2V5ID0gcmVzb2x2ZWRQYXRobmFtZTtcbiAgICAgICAgLy8gZW5zdXJlIC9pbmRleCBhbmQgLyBpcyBub3JtYWxpemVkIHRvIG9uZSBrZXlcbiAgICAgICAgY2FjaGVLZXkgPSBjYWNoZUtleSA9PT0gJy9pbmRleCcgPyAnLycgOiBjYWNoZUtleTtcbiAgICB9XG4gICAgY29uc3Qgc3VwcG9ydHNEeW5hbWljUmVzcG9uc2UgPSAvLyBJZiB3ZSdyZSBpbiBkZXZlbG9wbWVudCwgd2UgYWx3YXlzIHN1cHBvcnQgZHluYW1pYyBIVE1MXG4gICAgcm91dGVNb2R1bGUuaXNEZXYgPT09IHRydWUgfHwgLy8gSWYgdGhpcyBpcyBub3QgU1NHIG9yIGRvZXMgbm90IGhhdmUgc3RhdGljIHBhdGhzLCB0aGVuIGl0IHN1cHBvcnRzXG4gICAgLy8gZHluYW1pYyBIVE1MLlxuICAgICFpc0lzcjtcbiAgICAvLyBUaGlzIGlzIGEgcmV2YWxpZGF0aW9uIHJlcXVlc3QgaWYgdGhlIHJlcXVlc3QgaXMgZm9yIGEgc3RhdGljXG4gICAgLy8gcGFnZSBhbmQgaXQgaXMgbm90IGJlaW5nIHJlc3VtZWQgZnJvbSBhIHBvc3Rwb25lZCByZW5kZXIgYW5kXG4gICAgLy8gaXQgaXMgbm90IGEgZHluYW1pYyBSU0MgcmVxdWVzdCB0aGVuIGl0IGlzIGEgcmV2YWxpZGF0aW9uXG4gICAgLy8gcmVxdWVzdC5cbiAgICBjb25zdCBpc1JldmFsaWRhdGUgPSBpc0lzciAmJiAhc3VwcG9ydHNEeW5hbWljUmVzcG9uc2U7XG4gICAgY29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZCB8fCAnR0VUJztcbiAgICBjb25zdCB0cmFjZXIgPSBnZXRUcmFjZXIoKTtcbiAgICBjb25zdCBhY3RpdmVTcGFuID0gdHJhY2VyLmdldEFjdGl2ZVNjb3BlU3BhbigpO1xuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcHJlcmVuZGVyTWFuaWZlc3QsXG4gICAgICAgIHJlbmRlck9wdHM6IHtcbiAgICAgICAgICAgIGV4cGVyaW1lbnRhbDoge1xuICAgICAgICAgICAgICAgIGNhY2hlQ29tcG9uZW50czogQm9vbGVhbihuZXh0Q29uZmlnLmV4cGVyaW1lbnRhbC5jYWNoZUNvbXBvbmVudHMpLFxuICAgICAgICAgICAgICAgIGF1dGhJbnRlcnJ1cHRzOiBCb29sZWFuKG5leHRDb25maWcuZXhwZXJpbWVudGFsLmF1dGhJbnRlcnJ1cHRzKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1cHBvcnRzRHluYW1pY1Jlc3BvbnNlLFxuICAgICAgICAgICAgaW5jcmVtZW50YWxDYWNoZTogZ2V0UmVxdWVzdE1ldGEocmVxLCAnaW5jcmVtZW50YWxDYWNoZScpLFxuICAgICAgICAgICAgY2FjaGVMaWZlUHJvZmlsZXM6IChfbmV4dENvbmZpZ19leHBlcmltZW50YWwgPSBuZXh0Q29uZmlnLmV4cGVyaW1lbnRhbCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9uZXh0Q29uZmlnX2V4cGVyaW1lbnRhbC5jYWNoZUxpZmUsXG4gICAgICAgICAgICBpc1JldmFsaWRhdGUsXG4gICAgICAgICAgICB3YWl0VW50aWw6IGN0eC53YWl0VW50aWwsXG4gICAgICAgICAgICBvbkNsb3NlOiAoY2IpPT57XG4gICAgICAgICAgICAgICAgcmVzLm9uKCdjbG9zZScsIGNiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkFmdGVyVGFza0Vycm9yOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBvbkluc3RydW1lbnRhdGlvblJlcXVlc3RFcnJvcjogKGVycm9yLCBfcmVxdWVzdCwgZXJyb3JDb250ZXh0KT0+cm91dGVNb2R1bGUub25SZXF1ZXN0RXJyb3IocmVxLCBlcnJvciwgZXJyb3JDb250ZXh0LCByb3V0ZXJTZXJ2ZXJDb250ZXh0KVxuICAgICAgICB9LFxuICAgICAgICBzaGFyZWRDb250ZXh0OiB7XG4gICAgICAgICAgICBidWlsZElkXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IG5vZGVOZXh0UmVxID0gbmV3IE5vZGVOZXh0UmVxdWVzdChyZXEpO1xuICAgIGNvbnN0IG5vZGVOZXh0UmVzID0gbmV3IE5vZGVOZXh0UmVzcG9uc2UocmVzKTtcbiAgICBjb25zdCBuZXh0UmVxID0gTmV4dFJlcXVlc3RBZGFwdGVyLmZyb21Ob2RlTmV4dFJlcXVlc3Qobm9kZU5leHRSZXEsIHNpZ25hbEZyb21Ob2RlUmVzcG9uc2UocmVzKSk7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgaW52b2tlUm91dGVNb2R1bGUgPSBhc3luYyAoc3Bhbik9PntcbiAgICAgICAgICAgIHJldHVybiByb3V0ZU1vZHVsZS5oYW5kbGUobmV4dFJlcSwgY29udGV4dCkuZmluYWxseSgoKT0+e1xuICAgICAgICAgICAgICAgIGlmICghc3BhbikgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAgICdodHRwLnN0YXR1c19jb2RlJzogcmVzLnN0YXR1c0NvZGUsXG4gICAgICAgICAgICAgICAgICAgICduZXh0LnJzYyc6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdFNwYW5BdHRyaWJ1dGVzID0gdHJhY2VyLmdldFJvb3RTcGFuQXR0cmlidXRlcygpO1xuICAgICAgICAgICAgICAgIC8vIFdlIHdlcmUgdW5hYmxlIHRvIGdldCBhdHRyaWJ1dGVzLCBwcm9iYWJseSBPVEVMIGlzIG5vdCBlbmFibGVkXG4gICAgICAgICAgICAgICAgaWYgKCFyb290U3BhbkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocm9vdFNwYW5BdHRyaWJ1dGVzLmdldCgnbmV4dC5zcGFuX3R5cGUnKSAhPT0gQmFzZVNlcnZlclNwYW4uaGFuZGxlUmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuZXhwZWN0ZWQgcm9vdCBzcGFuIHR5cGUgJyR7cm9vdFNwYW5BdHRyaWJ1dGVzLmdldCgnbmV4dC5zcGFuX3R5cGUnKX0nLiBQbGVhc2UgcmVwb3J0IHRoaXMgTmV4dC5qcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vdmVyY2VsL25leHQuanNgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByb3V0ZSA9IHJvb3RTcGFuQXR0cmlidXRlcy5nZXQoJ25leHQucm91dGUnKTtcbiAgICAgICAgICAgICAgICBpZiAocm91dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGAke21ldGhvZH0gJHtyb3V0ZX1gO1xuICAgICAgICAgICAgICAgICAgICBzcGFuLnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgJ25leHQucm91dGUnOiByb3V0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdodHRwLnJvdXRlJzogcm91dGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnbmV4dC5zcGFuX25hbWUnOiBuYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzcGFuLnVwZGF0ZU5hbWUobmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bhbi51cGRhdGVOYW1lKGAke21ldGhvZH0gJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBoYW5kbGVSZXNwb25zZSA9IGFzeW5jIChjdXJyZW50U3Bhbik9PntcbiAgICAgICAgICAgIHZhciBfY2FjaGVFbnRyeV92YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlR2VuZXJhdG9yID0gYXN5bmMgKHsgcHJldmlvdXNDYWNoZUVudHJ5IH0pPT57XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFnZXRSZXF1ZXN0TWV0YShyZXEsICdtaW5pbWFsTW9kZScpICYmIGlzT25EZW1hbmRSZXZhbGlkYXRlICYmIHJldmFsaWRhdGVPbmx5R2VuZXJhdGVkICYmICFwcmV2aW91c0NhY2hlRW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb24tZGVtYW5kIHJldmFsaWRhdGUgYWx3YXlzIHNldHMgdGhpcyBoZWFkZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ3gtbmV4dGpzLWNhY2hlJywgJ1JFVkFMSURBVEVEJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCdUaGlzIHBhZ2UgY291bGQgbm90IGJlIGZvdW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGludm9rZVJvdXRlTW9kdWxlKGN1cnJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxLmZldGNoTWV0cmljcyA9IGNvbnRleHQucmVuZGVyT3B0cy5mZXRjaE1ldHJpY3M7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwZW5kaW5nV2FpdFVudGlsID0gY29udGV4dC5yZW5kZXJPcHRzLnBlbmRpbmdXYWl0VW50aWw7XG4gICAgICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdXNpbmcgcHJvdmlkZWQgd2FpdFVudGlsIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCdzIG5vdCB3ZSBmYWxsYmFjayB0byBzZW5kUmVzcG9uc2UncyBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVuZGluZ1dhaXRVbnRpbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0eC53YWl0VW50aWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgud2FpdFVudGlsKHBlbmRpbmdXYWl0VW50aWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmdXYWl0VW50aWwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FjaGVUYWdzID0gY29udGV4dC5yZW5kZXJPcHRzLmNvbGxlY3RlZFRhZ3M7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZXF1ZXN0IGlzIGZvciBhIHN0YXRpYyByZXNwb25zZSwgd2UgY2FuIGNhY2hlIGl0IHNvIGxvbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gYXMgaXQncyBub3QgZWRnZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzSXNyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29weSB0aGUgaGVhZGVycyBmcm9tIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSB0b05vZGVPdXRnb2luZ0h0dHBIZWFkZXJzKHJlc3BvbnNlLmhlYWRlcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlVGFncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbTkVYVF9DQUNIRV9UQUdTX0hFQURFUl0gPSBjYWNoZVRhZ3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddICYmIGJsb2IudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddID0gYmxvYi50eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV2YWxpZGF0ZSA9IHR5cGVvZiBjb250ZXh0LnJlbmRlck9wdHMuY29sbGVjdGVkUmV2YWxpZGF0ZSA9PT0gJ3VuZGVmaW5lZCcgfHwgY29udGV4dC5yZW5kZXJPcHRzLmNvbGxlY3RlZFJldmFsaWRhdGUgPj0gSU5GSU5JVEVfQ0FDSEUgPyBmYWxzZSA6IGNvbnRleHQucmVuZGVyT3B0cy5jb2xsZWN0ZWRSZXZhbGlkYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhwaXJlID0gdHlwZW9mIGNvbnRleHQucmVuZGVyT3B0cy5jb2xsZWN0ZWRFeHBpcmUgPT09ICd1bmRlZmluZWQnIHx8IGNvbnRleHQucmVuZGVyT3B0cy5jb2xsZWN0ZWRFeHBpcmUgPj0gSU5GSU5JVEVfQ0FDSEUgPyB1bmRlZmluZWQgOiBjb250ZXh0LnJlbmRlck9wdHMuY29sbGVjdGVkRXhwaXJlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjYWNoZSBlbnRyeSBmb3IgdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FjaGVFbnRyeSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kOiBDYWNoZWRSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogQnVmZmVyLmZyb20oYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVDb250cm9sOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmFsaWRhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGlyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVFbnRyeTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbmQgcmVzcG9uc2Ugd2l0aG91dCBjYWNoaW5nIGlmIG5vdCBJU1JcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmRSZXNwb25zZShub2RlTmV4dFJlcSwgbm9kZU5leHRSZXMsIHJlc3BvbnNlLCBjb250ZXh0LnJlbmRlck9wdHMucGVuZGluZ1dhaXRVbnRpbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgYmFja2dyb3VuZCByZXZhbGlkYXRlIHdlIG5lZWQgdG8gcmVwb3J0XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSByZXF1ZXN0IGVycm9yIGhlcmUgYXMgaXQgd29uJ3QgYmUgYnViYmxlZFxuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlvdXNDYWNoZUVudHJ5ID09IG51bGwgPyB2b2lkIDAgOiBwcmV2aW91c0NhY2hlRW50cnkuaXNTdGFsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgcm91dGVNb2R1bGUub25SZXF1ZXN0RXJyb3IocmVxLCBlcnIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0ZXJLaW5kOiAnQXBwIFJvdXRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGVQYXRoOiBzcmNQYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlVHlwZTogJ3JvdXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZhbGlkYXRlUmVhc29uOiBnZXRSZXZhbGlkYXRlUmVhc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNSZXZhbGlkYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc09uRGVtYW5kUmV2YWxpZGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByb3V0ZXJTZXJ2ZXJDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlRW50cnkgPSBhd2FpdCByb3V0ZU1vZHVsZS5oYW5kbGVSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgICAgIG5leHRDb25maWcsXG4gICAgICAgICAgICAgICAgY2FjaGVLZXksXG4gICAgICAgICAgICAgICAgcm91dGVLaW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICAgICAgICAgIGlzRmFsbGJhY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHByZXJlbmRlck1hbmlmZXN0LFxuICAgICAgICAgICAgICAgIGlzUm91dGVQUFJFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc09uRGVtYW5kUmV2YWxpZGF0ZSxcbiAgICAgICAgICAgICAgICByZXZhbGlkYXRlT25seUdlbmVyYXRlZCxcbiAgICAgICAgICAgICAgICByZXNwb25zZUdlbmVyYXRvcixcbiAgICAgICAgICAgICAgICB3YWl0VW50aWw6IGN0eC53YWl0VW50aWxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gd2UgZG9uJ3QgY3JlYXRlIGEgY2FjaGVFbnRyeSBmb3IgSVNSXG4gICAgICAgICAgICBpZiAoIWlzSXNyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKGNhY2hlRW50cnkgPT0gbnVsbCA/IHZvaWQgMCA6IChfY2FjaGVFbnRyeV92YWx1ZSA9IGNhY2hlRW50cnkudmFsdWUpID09IG51bGwgPyB2b2lkIDAgOiBfY2FjaGVFbnRyeV92YWx1ZS5raW5kKSAhPT0gQ2FjaGVkUm91dGVLaW5kLkFQUF9ST1VURSkge1xuICAgICAgICAgICAgICAgIHZhciBfY2FjaGVFbnRyeV92YWx1ZTE7XG4gICAgICAgICAgICAgICAgdGhyb3cgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5ldyBFcnJvcihgSW52YXJpYW50OiBhcHAtcm91dGUgcmVjZWl2ZWQgaW52YWxpZCBjYWNoZSBlbnRyeSAke2NhY2hlRW50cnkgPT0gbnVsbCA/IHZvaWQgMCA6IChfY2FjaGVFbnRyeV92YWx1ZTEgPSBjYWNoZUVudHJ5LnZhbHVlKSA9PSBudWxsID8gdm9pZCAwIDogX2NhY2hlRW50cnlfdmFsdWUxLmtpbmR9YCksIFwiX19ORVhUX0VSUk9SX0NPREVcIiwge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogXCJFNzAxXCIsXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ2V0UmVxdWVzdE1ldGEocmVxLCAnbWluaW1hbE1vZGUnKSkge1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ3gtbmV4dGpzLWNhY2hlJywgaXNPbkRlbWFuZFJldmFsaWRhdGUgPyAnUkVWQUxJREFURUQnIDogY2FjaGVFbnRyeS5pc01pc3MgPyAnTUlTUycgOiBjYWNoZUVudHJ5LmlzU3RhbGUgPyAnU1RBTEUnIDogJ0hJVCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRHJhZnQgbW9kZSBzaG91bGQgbmV2ZXIgYmUgY2FjaGVkXG4gICAgICAgICAgICBpZiAoaXNEcmFmdE1vZGUpIHtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgJ3ByaXZhdGUsIG5vLWNhY2hlLCBuby1zdG9yZSwgbWF4LWFnZT0wLCBtdXN0LXJldmFsaWRhdGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSBmcm9tTm9kZU91dGdvaW5nSHR0cEhlYWRlcnMoY2FjaGVFbnRyeS52YWx1ZS5oZWFkZXJzKTtcbiAgICAgICAgICAgIGlmICghKGdldFJlcXVlc3RNZXRhKHJlcSwgJ21pbmltYWxNb2RlJykgJiYgaXNJc3IpKSB7XG4gICAgICAgICAgICAgICAgaGVhZGVycy5kZWxldGUoTkVYVF9DQUNIRV9UQUdTX0hFQURFUik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiBjYWNoZSBjb250cm9sIGlzIGFscmVhZHkgc2V0IG9uIHRoZSByZXNwb25zZSB3ZSBkb24ndFxuICAgICAgICAgICAgLy8gb3ZlcnJpZGUgaXQgdG8gYWxsb3cgdXNlcnMgdG8gY3VzdG9taXplIGl0IHZpYSBuZXh0LmNvbmZpZ1xuICAgICAgICAgICAgaWYgKGNhY2hlRW50cnkuY2FjaGVDb250cm9sICYmICFyZXMuZ2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJykgJiYgIWhlYWRlcnMuZ2V0KCdDYWNoZS1Db250cm9sJykpIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzLnNldCgnQ2FjaGUtQ29udHJvbCcsIGdldENhY2hlQ29udHJvbEhlYWRlcihjYWNoZUVudHJ5LmNhY2hlQ29udHJvbCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgc2VuZFJlc3BvbnNlKG5vZGVOZXh0UmVxLCBub2RlTmV4dFJlcywgbmV3IFJlc3BvbnNlKGNhY2hlRW50cnkudmFsdWUuYm9keSwge1xuICAgICAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBjYWNoZUVudHJ5LnZhbHVlLnN0YXR1cyB8fCAyMDBcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPOiBhY3RpdmVTcGFuIGNvZGUgcGF0aCBpcyBmb3Igd2hlbiB3cmFwcGVkIGJ5XG4gICAgICAgIC8vIG5leHQtc2VydmVyIGNhbiBiZSByZW1vdmVkIHdoZW4gdGhpcyBpcyBubyBsb25nZXIgdXNlZFxuICAgICAgICBpZiAoYWN0aXZlU3Bhbikge1xuICAgICAgICAgICAgYXdhaXQgaGFuZGxlUmVzcG9uc2UoYWN0aXZlU3Bhbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCB0cmFjZXIud2l0aFByb3BhZ2F0ZWRDb250ZXh0KHJlcS5oZWFkZXJzLCAoKT0+dHJhY2VyLnRyYWNlKEJhc2VTZXJ2ZXJTcGFuLmhhbmRsZVJlcXVlc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bhbk5hbWU6IGAke21ldGhvZH0gJHtyZXEudXJsfWAsXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IFNwYW5LaW5kLlNFUlZFUixcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2h0dHAubWV0aG9kJzogbWV0aG9kLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2h0dHAudGFyZ2V0JzogcmVxLnVybFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgaGFuZGxlUmVzcG9uc2UpKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBOb0ZhbGxiYWNrRXJyb3IpKSB7XG4gICAgICAgICAgICBhd2FpdCByb3V0ZU1vZHVsZS5vblJlcXVlc3RFcnJvcihyZXEsIGVyciwge1xuICAgICAgICAgICAgICAgIHJvdXRlcktpbmQ6ICdBcHAgUm91dGVyJyxcbiAgICAgICAgICAgICAgICByb3V0ZVBhdGg6IG5vcm1hbGl6ZWRTcmNQYWdlLFxuICAgICAgICAgICAgICAgIHJvdXRlVHlwZTogJ3JvdXRlJyxcbiAgICAgICAgICAgICAgICByZXZhbGlkYXRlUmVhc29uOiBnZXRSZXZhbGlkYXRlUmVhc29uKHtcbiAgICAgICAgICAgICAgICAgICAgaXNSZXZhbGlkYXRlLFxuICAgICAgICAgICAgICAgICAgICBpc09uRGVtYW5kUmV2YWxpZGF0ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXRocm93IHNvIHRoYXQgd2UgY2FuIGhhbmRsZSBzZXJ2aW5nIGVycm9yIHBhZ2VcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBkdXJpbmcgc3RhdGljIGdlbmVyYXRpb24sIHRocm93IHRoZSBlcnJvciBhZ2Fpbi5cbiAgICAgICAgaWYgKGlzSXNyKSB0aHJvdyBlcnI7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgc2VuZCBhIDUwMCByZXNwb25zZS5cbiAgICAgICAgYXdhaXQgc2VuZFJlc3BvbnNlKG5vZGVOZXh0UmVxLCBub2RlTmV4dFJlcywgbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICAgICAgICAgIHN0YXR1czogNTAwXG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgemini%2Fevaluate%2Froute&page=%2Fapi%2Fgemini%2Fevaluate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgemini%2Fevaluate%2Froute.ts&appDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/server/app-render/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/action-async-storage.external.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "./work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?32c4":
/*!****************************!*\
  !*** bufferutil (ignored) ***!
  \****************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?66e9":
/*!********************************!*\
  !*** utf-8-validate (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "fs/promises":
/*!******************************!*\
  !*** external "fs/promises" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("fs/promises");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "next/dist/shared/lib/no-fallback-error.external":
/*!******************************************************************!*\
  !*** external "next/dist/shared/lib/no-fallback-error.external" ***!
  \******************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/no-fallback-error.external");

/***/ }),

/***/ "next/dist/shared/lib/router/utils/app-paths":
/*!**************************************************************!*\
  !*** external "next/dist/shared/lib/router/utils/app-paths" ***!
  \**************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/app-paths");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:buffer");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ "node:http":
/*!****************************!*\
  !*** external "node:http" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:http");

/***/ }),

/***/ "node:https":
/*!*****************************!*\
  !*** external "node:https" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:https");

/***/ }),

/***/ "node:net":
/*!***************************!*\
  !*** external "node:net" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:net");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

/***/ }),

/***/ "node:process":
/*!*******************************!*\
  !*** external "node:process" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:process");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ "node:stream/promises":
/*!***************************************!*\
  !*** external "node:stream/promises" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream/promises");

/***/ }),

/***/ "node:stream/web":
/*!**********************************!*\
  !*** external "node:stream/web" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream/web");

/***/ }),

/***/ "node:url":
/*!***************************!*\
  !*** external "node:url" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:url");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ "node:zlib":
/*!****************************!*\
  !*** external "node:zlib" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:zlib");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("worker_threads");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@google","vendor-chunks/google-auth-library","vendor-chunks/ws","vendor-chunks/bignumber.js","vendor-chunks/gaxios","vendor-chunks/json-bigint","vendor-chunks/gtoken","vendor-chunks/google-logging-utils","vendor-chunks/gcp-metadata","vendor-chunks/jws","vendor-chunks/jwa","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/base64-js","vendor-chunks/extend","vendor-chunks/safe-buffer","vendor-chunks/buffer-equal-constant-time"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgemini%2Fevaluate%2Froute&page=%2Fapi%2Fgemini%2Fevaluate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgemini%2Fevaluate%2Froute.ts&appDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fgobili%2Frepos%2FCognitive-Revision-Engine&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=!")));
module.exports = __webpack_exports__;

})();