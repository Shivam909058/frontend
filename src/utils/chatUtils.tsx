export const truncateTopic = (topic: string, maxLength: number = 35) => {
  return topic.length > maxLength ? topic.slice(0, maxLength) + "..." : topic;
};

export const adjustTextareaHeight = (textareaRef: React.RefObject<HTMLTextAreaElement>) => {
  const textarea = textareaRef.current;
  if (textarea) {
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 150); // Max height of 150px
    textarea.style.height = `${newHeight}px`;
  }
};
