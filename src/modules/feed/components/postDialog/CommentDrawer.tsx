import { Drawer } from "@material-tailwind/react";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CommentDrawerProps = {
  close: () => void;
  postId?: string;
  comments: any;
  commentsLoading: boolean;
  commentContent: string;
  setCommentContent: (content: string) => void;
  handleCommentClick: () => void;
  replyContext: {
    active: boolean;
    username: string;
    parentId: string | null;
  };
  setReplyContext: (context: {
    active: boolean;
    username: string;
    parentId: string | null;
  }) => void;
  renderComments: any;
  authenticatedUserId: string;
};

const CommentDrawer = ({
  close,
  comments,
  commentsLoading,
  commentContent,
  setCommentContent,
  handleCommentClick,
  renderComments,
  replyContext,
  setReplyContext,
  authenticatedUserId,
}: CommentDrawerProps) => {
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [drawerSize, setDrawerSize] = useState(300);

  useEffect(() => {
    if (commentsLoading) return;
    if (comments.length === 0) {
      setDrawerSize(300);
    } else {
      const size = Math.min(300 + comments.length * 50, 600);
      setDrawerSize(size);
    }
  }, [commentsLoading, comments]);

  return createPortal(
    <Drawer
      open
      placement="bottom"
      placeholder="Bottom Drawer"
      onClose={() => close()}
      size={drawerSize}
      className="bg-white px-7 pt-3 pb-11 shadow-2xl border-0 rounded-t-3xl overflow-scroll max-w-[430px]"
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <div>
        <div className="w-full flex justify-center align-center">
          <img src="/assets/rectangle.svg" alt="rectangle icon" />
        </div>

        {commentsLoading ? (
          <p>Loading comments...</p>
        ) : (
          <div className="mb-12 pt-10">
            {renderComments(comments, null, 0, new Set())}
          </div>
        )}
        {authenticatedUserId && (
          <div className="fixed bottom-0 left-0 w-full mt-4">
            {replyContext.active && (
              <div className="flex gap-5 px-2 py-3 text-[10px] bg-[#f8ffb7] rounded-none border-0 border-solid border-zinc-400 shadow-[0px_-2px_4px_rgba(0,0,0,0.1)] w-1/2 font-lexend items-center rounded-t-lg">
                <p className="flex-auto">Replying to {replyContext.username}</p>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/f535ad2e81f03c7402df03b7ca1811b9a3af719657f273e4f0c34f7fc2613d2b?apiKey=9e0e13693454444cac96580d4357c01c&"
                  alt="close icon"
                  className="shrink-0 self-start w-2 aspect-square fill-slate-900 mt-1 cursor-pointer"
                  onClick={() =>
                    setReplyContext({
                      active: false,
                      username: "",
                      parentId: null,
                    })
                  }
                />
              </div>
            )}
            <div className="flex flex-col justify-center py-2.5 text-sm font-light text-black bg-white border-0 border-solid border-zinc-400 shadow-[0px_-2px_4px_rgba(0,0,0,0.1)] rounded-xl">
              <div className="flex gap-5 items-start px-8 pt-2.5 pb-4 w-full bg-white">
                <input
                  ref={commentInputRef}
                  className="flex-auto my-auto focus:outline-none focus:ring-transparent"
                  placeholder="write a comment"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  autoFocus
                />
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/12a87713df5efdf7e064c0b5e8da8e0360328d8c738ec962b49607896644ded3?apiKey=9e0e13693454444cac96580d4357c01c&"
                  alt="User avatar"
                  className="shrink-0 self-start aspect-[1.32] w-[42px] cursor-pointer"
                  onClick={handleCommentClick}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>,
    document.body
  );
};

export { CommentDrawer };
