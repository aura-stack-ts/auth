import { useState } from "react"
import { Button } from "@/components/ui/button"

export const EditProfile = ({ action }: { action: (formData: FormData) => void | Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false)

    const updateSession = async (formData: FormData) => {
        await action(formData)
        setIsOpen(false)
    }

    return (
        <section>
            <div className="mt-4 pt-4 flex items-center justify-between gap-x-4 border-t">
                <div>
                    <label className="font-medium block" htmlFor="signout">
                        Edit Profile
                    </label>
                    <span className="text-sm">Edit your profile information</span>
                </div>
                <Button
                    className="w-20 data-[open='true']:hidden"
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
                        <input
                            type="text"
                            id="username"
                            name="username"
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
                            className="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                        <Button className="w-full mt-6" variant="default">
                            Edit
                        </Button>
                        <Button className="w-full mt-6" variant="secondary" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
        </section>
    )
}
