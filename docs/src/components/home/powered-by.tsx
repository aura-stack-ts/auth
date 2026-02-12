export const PoweredBy = () => {
    return (
        <section className="py-24 border-t border-border">
            <h2 className="flex items-center justify-center gap-x-8 text-center">
                <span className="w-3 h-1 block bg-white" />
                Powered by
                <span className="w-3 h-1 block bg-white" />
            </h2>
            <div className="mt-8 flex items-center justify-center gap-x-8 overflow-hidden">
                <span className="w-0 min-w-fit">TypeScript</span>
                <span className="w-0 min-w-fit">Next.js</span>
                <span className="w-0 min-w-fit">React</span>
                <span className="w-0 min-w-fit">Node.js</span>
                <span className="w-0 min-w-fit">OAuth 2.0</span>
                <span className="w-0 min-w-fit">OpenID</span>
            </div>
        </section>
    )
}
