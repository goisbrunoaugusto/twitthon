import { Link } from "react-router-dom";
import type { Post } from "../types.ts";
import { ACCESS_TOKEN } from "../constants.ts";
import { jwtDecode } from "jwt-decode";

interface PostProps {
    post: Post;
    handleLike: (post: Post) => void;
}
const token = localStorage.getItem(ACCESS_TOKEN);
let jwtDecodedId = "";
if (token) {
    const decoded: any = jwtDecode(token);
    jwtDecodedId = decoded.user_id;
    console.log("JWT TOKEN:", token);
    console.log("Decoded JWT:", decoded);
    console.log("JWT Decoded Id:", jwtDecodedId);
}



const Post = ({ post, handleLike }: PostProps) => (
    <div className="bg-base-200 rounded-lg p-4 flex gap-3">
        <div>
            <div className="font-semibold">
                <Link
                    to={`/users/${post.author}`}
                    className="hover:text-primary transition-colors"
                >
                    {post.author}
                </Link>

                <span className="ml-3 text-xs text-base-content/50">
                    {new Date(post.created_at).toLocaleString()}
                </span>
            </div>
            <div className="mb-2">
                {post.content}
                {post.image && (
                    <img
                        src={post.image}
                        alt="Image"
                        className="rounded-lg max-h-64 mt-2"
                        style={{ maxWidth: "100%" }}
                    />
                )}
            </div>
            <div className="flex gap-4 text-base-content/60 text-sm items-center">
                <button
                    className="hover:text-primary"
                    onClick={() => handleLike(post)}
                    aria-label={post.liked ? "Unlike" : "Like"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={post.liked ? "red" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-5 h-5 inline"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                        />
                    </svg>
                    <span className="ml-1">{post.likes}</span>
                </button>
            </div>
        </div>
    </div>
);

export default Post;