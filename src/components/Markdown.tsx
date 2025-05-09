import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

export const Markdown = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words custom-markdown space-y-4"
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({
          node,
          inline,
          className,
          children,
          ...props
        }: React.HTMLProps<HTMLElement> & { node?: any; inline?: boolean }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <pre className="my-4">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        ol: ({ children, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
          <ol className="list-decimal list-inside my-2" {...props}>
            {children}
          </ol>
        ),
        ul: ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
          <ul className="list-disc list-inside my-2" {...props}>
            {children}
          </ul>
        ),
        li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
          <li className="my-2" {...props}>
            {children}
          </li>
        ),
        p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
          <p className="my-2" {...props}>
            {children}
          </p>
        ),
        h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
          <h1 className="text-2xl font-bold my-6" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
          <h2 className="text-xl font-semibold my-5" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
          <h3 className="text-lg font-medium my-4" {...props}>
            {children}
          </h3>
        ),
        a: ({ children, href, ...props }: React.ComponentPropsWithoutRef<"a">) => (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            {...props}
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
