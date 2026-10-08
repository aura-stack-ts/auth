import { useState } from "react"
import { Form } from "react-router"
import { Button } from "~/components/ui/button"

export const EditProfile = () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <section>
            <div className="flex items-center justify-between gap-x-4">
                <div>
                    <p className="font-medium">Edit Profile</p>
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
                <Form className="w-full mt-4 pt-4 text-start border-t" method="POST">
                    <input type="hidden" name="action" value="updateSession" />
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
                        <Button className="w-full mt-6" variant="default" type="submit">
                            Edit
                        </Button>
                        <Button className="w-full mt-6" variant="destructive" type="button" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </Form>
            )}
        </section>
    )
}
