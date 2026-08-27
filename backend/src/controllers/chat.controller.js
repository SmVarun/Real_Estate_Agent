import { chatMessageSchema } from "../validator/chat.validator.js";
import { answerQuestion } from "../services/chat.service.js";

/*
 * HTTP edge for the RAG chat. No retrieval, no prompts, no LLM calls —
 * validate, delegate, shape the response.
 */
export const chatHandler = async (req, res, next) => {
  try {
    const { message, topK } = chatMessageSchema.parse(req.body);

    const { answer, sources, contextFound } = await answerQuestion({
      message,
      topK,
    });

    return res.status(200).json({
      success: true,
      data: {
        answer,
        sources,
        contextFound,
      },
    });
  } catch (error) {
    /*
     * Including ZodError: the global handler in app.js already turns
     * those into a 400 with per-field messages.
     */
    next(error);
  }
};
