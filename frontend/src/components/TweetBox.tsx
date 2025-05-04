import { useRef } from "react";

interface TweetBoxProps {
    tweetContent: string;
    setTweetContent: (content: string) => void;
    tweetImage: File | null;
    setTweetImage: (file: File | null) => void;
    onTweet: () => void;
}

const TweetBox = ({
    tweetContent,
    setTweetContent,
    tweetImage,
    setTweetImage,
    onTweet,
}: TweetBoxProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-base-200 rounded-lg p-4 flex gap-3 items-start">
            <div className="flex-1 flex flex-col gap-2">
                <textarea
                    className="focus:border-primary textarea textarea-bordered textarea-primary w-full resize-none"
                    placeholder="What's happening?"
                    rows={3}
                    value={tweetContent}
                    onChange={e => setTweetContent(e.target.value)}
                />
                <div className="flex flex-row gap-2 items-center">
                    <button
                        className="btn btn-active btn-primary"
                        onClick={onTweet}
                        disabled={!tweetContent.trim() && !tweetImage}
                    >
                        Tweet
                    </button>
                    {!tweetImage && (
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="file-input file-input-ghost file-input-primary w-full max-w-xs"
                            onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                    setTweetImage(e.target.files[0]);
                                } else {
                                    setTweetImage(null);
                                }
                            }}
                        />
                    )}
                    {tweetImage && (
                        <div className="mt-2 flex flex-col items-center">
                            <img
                                src={URL.createObjectURL(tweetImage)}
                                alt="Preview"
                                className="rounded-lg max-h-[32rem]"
                                style={{ maxWidth: "100%" }}
                            />
                            <button
                                className="btn btn-xs btn-error mt-2"
                                onClick={() => {
                                    setTweetImage(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            >
                                Remover imagem
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TweetBox;