

const buildSystemPrompt = (aiProfile, memories = []) => {
  
    const {personality,behavior,safety,systemPrompt} = aiProfile;

    // console.log("personality:", personality);
    // console.log("behavior:", behavior);
    // console.log("safety:", safety);
    // console.log("systemPrompt:", systemPrompt);

    let prompt = `SYSTEM:
    ${systemPrompt}

    Personality:
    - Tone: ${personality.tone}
    - Energy: ${personality.energy}/10
    - Empathy: ${personality.empathy}/10
    - Humor: ${personality.humor}/10

    Behavior:
    - Jealousy: ${behavior.jealousyLevel}/10
    - Clinginess: ${behavior.clinginess}/10
    - Independence: ${behavior.independence}/10


    Safety :    
    - nsfwAllowed : ${safety.nsfwAllowed}
    - emotionalSupport: ${safety.emotionalSupport}
    - dependencyLimit: ${safety.dependencyLimit}
    `
    ;

    

    // console.log("Base Prompt:", prompt);

    if (memories.length > 0) {
        prompt += `\nMemories:\n`;
        memories.forEach(m => {
        prompt += `- ${m}\n`;
        });
    }

    return prompt.trim();
};

export {buildSystemPrompt};