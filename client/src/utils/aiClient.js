import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

// cross-encoder/nli-MiniLM2-L6-H768 via Xenova — significantly more accurate
// zero-shot NLI model than MobileBERT-MNLI, while still being browser-friendly
class AIModelPipeline {
  static model = 'Xenova/nli-deberta-v3-small';
  static instance = null;

  static async getInstance(progressCallback = null) {
    if (this.instance === null) {
      this.instance = pipeline('zero-shot-classification', this.model, {
        progress_callback: progressCallback
      });
    }
    return this.instance;
  }
}

const SCAM_LABELS = ['phishing scam', 'financial fraud', 'job fraud', 'malicious link', 'OTP theft'];
const SAFE_LABELS = ['legitimate bank notification', 'safe promotional message', 'normal conversation'];
const ALL_LABELS = [...SCAM_LABELS, ...SAFE_LABELS];

export async function analyzeTextWithAI(text, onProgress = null) {
  try {
    const classifier = await AIModelPipeline.getInstance(onProgress);

    const output = await classifier(text, ALL_LABELS, { multi_label: true });

    // Sum confidence across all scam labels vs safe labels
    const labelMap = Object.fromEntries(output.labels.map((l, i) => [l, output.scores[i]]));

    const scamScore = SCAM_LABELS.reduce((sum, l) => sum + (labelMap[l] ?? 0), 0) / SCAM_LABELS.length;
    const safeScore = SAFE_LABELS.reduce((sum, l) => sum + (labelMap[l] ?? 0), 0) / SAFE_LABELS.length;

    // Top scam label for labeling
    const topScamLabel = SCAM_LABELS.reduce((a, b) => (labelMap[a] ?? 0) > (labelMap[b] ?? 0) ? a : b);
    const topScamConf = labelMap[topScamLabel] ?? 0;

    const isScam = scamScore > safeScore && topScamConf > 0.35;
    const aiRiskScore = Math.round(Math.min(scamScore * 130, 100)); // amplify slightly for sensitivity

    return {
      label: topScamLabel,
      confidence: Math.round(topScamConf * 100),
      aiRiskScore,
      isScam,
      rawOutput: output
    };
  } catch (err) {
    console.error('AI Classification Error:', err);
    return { error: true, message: err.message };
  }
}
