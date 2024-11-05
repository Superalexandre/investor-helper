import type { Dispatch, SetStateAction } from "react"
import Login from "../form/login"
import Register from "../form/register"
import { Card, CardContent } from "../ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DialogAccountProps {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
    redirect?: string
    callback?: () => void
}

export default function DialogAccount({ open, setOpen, redirect, callback }: DialogAccountProps) {
    return (
		<Dialog open={open} onOpenChange={(newOpen) => setOpen(newOpen)}>
			<DialogContent className="w-11/12">
				<DialogHeader>
					<DialogTitle>
                        Créer un compte ou se connecter
                    </DialogTitle>
                    <DialogDescription>
                        Connectez-vous ou créer un compte pour acceder a plus de fonctionnalités
                    </DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="login" className="min-h-max w-full">
					<TabsList className="w-full">
						<TabsTrigger className="w-full" value="login">Connexion</TabsTrigger>
						<TabsTrigger className="w-full" value="register">Créer un compte</TabsTrigger>
					</TabsList>
					<TabsContent value="login">
                        <Card>
                            <CardContent className="pt-4">
                                <Login 
                                    redirect={redirect}
                                    callback={callback}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
					<TabsContent value="register">
                        <Card>
                            <CardContent className="pt-4">
                                <Register 
                                    redirect={redirect}
                                    callback={callback}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
				</Tabs>

			</DialogContent>
		</Dialog>
	)
}
