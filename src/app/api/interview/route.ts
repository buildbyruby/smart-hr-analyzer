import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, jobTitle, jobDescription, score, weaknesses } = body

    if (!resumeText || !jobTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `You are an expert technical interviewer and talent acquisition specialist.

Based on the following candidate information, generate exactly 8 targeted interview questions.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Candidate ATS Score: ${score}/100
Candidate Weaknesses identified: ${weaknesses?.join(', ')}

Resume Summary:
${resumeText.substring(0, 2000)}

Generate 8 interview questions that:
1. Probe specifically into the candidate's identified weaknesses
2. Verify the skills claimed in their resume
3. Are relevant to the job requirements
4. Mix behavioral, technical, and situational questions

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "questions": [
    { "type": "Technical", "question": "...", "purpose": "one sentence on what this reveals about the candidate" },
    { "type": "Behavioral", "question": "...", "purpose": "..." },
    { "type": "Situational", "question": "...", "purpose": "..." },
    { "type": "Technical", "question": "...", "purpose": "..." },
    { "type": "Behavioral", "question": "...", "purpose": "..." },
    { "type": "Technical", "question": "...", "purpose": "..." },
    { "type": "Situational", "question": "...", "purpose": "..." },
    { "type": "Behavioral", "question": "...", "purpose": "..." }
  ]
}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 2000,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Interview generation error:', error)
    return NextResponse.json({ error: 'Failed to generate questions: ' + error.message }, { status: 500 })
  }
}
