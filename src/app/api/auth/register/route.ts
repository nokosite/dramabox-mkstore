import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Use Admin client to bypass RLS
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        // Basic Validation
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Email, password, and name are required." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters." },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        // If single() returns row -> user exists
        // If single() returns error -> user might not exist (PGRST116) or actual error
        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists with this email." },
                { status: 409 }
            );
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert User
        const { data, error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
                email,
                name,
                password: hashedPassword, // Ensure 'password' column exists in Supabase
                provider: "credentials",
                image: "", // Optional default avatar or blank
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error("SignUp Insert Error:", insertError);
            return NextResponse.json(
                { error: "Failed to create user. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "User created successfully", user: data },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("SignUp Handler Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
