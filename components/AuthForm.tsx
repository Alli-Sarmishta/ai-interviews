"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {email, z} from "zod"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import {useRouter} from "next/navigation"
import {createUserWithEmailAndPassword} from "firebase/auth"
import {auth} from "@/firebase/client"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {signInWithEmailAndPassword} from "firebase/auth"
import { signUp, signIn } from "@/lib/actions/auth.actions";


const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
        email: z.string().email(),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    })
}

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter()
    const formSchema = authFormSchema(type)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (type === "sign-up") {
                const{name,email,password} = values;
                const userCredentials = await createUserWithEmailAndPassword(auth, email, password);

                const result = await signUp({
                    uid: userCredentials.user.uid,
                    name: name!,
                    email,
                    password,
                })

                if(!result?.success){
                    toast.error(result?.message);
                    return;
                }

                toast.success("Account successfully created! Please Sign in.")
                router.push('/sign-in')
            } else {
                const { email,password } = values;
                const userCredentials = await signInWithEmailAndPassword(auth,email,password);


                const idToken = await userCredentials.user.getIdToken();

                if(!idToken){
                    toast.error('sign in failed')
                    return;
                }

                await signIn({
                    email, idToken
                })

                toast.success('Signed in successfully.');
                router.push('/')
            }
        } catch (error) {
            console.log(error)
            toast.error(`Error: ${error}`)
        }
    }

    const isSignIn = type === "sign-in"

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="logo" height={32} width={38} />
                    <h2 className="text-primary-100">PrepGenie</h2>
                </div>

                <h3 className="text-center">Practice job interview with AI</h3>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4">

                        {!isSignIn && (
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your email address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button className="btn w-full" type="submit">
                            {isSignIn ? "Sign in" : "Create an Account"}
                        </Button>
                    </form>
                </Form>

                <p className="text-center">
                    {isSignIn ? "No account yet?" : "Have an account already?"}
                    <Link
                        href={!isSignIn ? "/sign-in" : "/sign-up"}
                        className="font-bold text-user-primary ml-1"
                    >
                        {!isSignIn ? "Sign in" : "Sign up"}
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default AuthForm