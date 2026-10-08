"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const EditProfile = ({ action }: { action: (formData: FormData) => void | Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false)

    const updateSession = async (formData: FormData) => {
        await action(formData)
        setIsOpen(false)
    }

    return (
        <section>
            <div className="flex items-center justify-between gap-x-4">
                <div>
                    <label className="font-medium block" htmlFor="signout">
                        Edit Profile
                    </label>
                    <span className="text-sm">Edit your profile information</span>
                </div>
                <Button
                    className="w-17.5 data-[open='true']:hidden"
                    variant="secondary"
                    data-open={isOpen}
                    onClick={() => setIsOpen(true)}
                >
                    Edit
                </Button>
            </div>
            {isOpen && (
                <form className="w-full mt-4 pt-4 text-start border-t" action={updateSession}>
                    <div>
                        <label className="font-medium block" htmlFor="username">
                            Username
                        </label>
                        <Input
                            type="text"
                            id="username"
                            name="username"
                            aria-label="Username"
                            autoComplete="username"
                            aria-autocomplete="list"
                            className="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                        />
                    </div>
                    <div className="mt-4">
                        <label className="font-medium block" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            aria-label="Email"
                            autoComplete="email"
                            aria-autocomplete="list"
                            className="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                        />
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-x-4">
                        <Button type="submit">Edit</Button>
                        <Button variant="destructive" type="button" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
        </section>
    )
}
