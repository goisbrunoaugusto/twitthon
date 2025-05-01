export type Post = {
    id: number;
    author: string;
    content: string;
    created_at: string;
    likes: number;
    image?: string | null;
    liked?: boolean;
};

export type User = {
    id: number;
    username: string;
    email: string;
    date_joined: string;
};
