import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_dropdown = """        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("h-9 px-2 sm:px-3 rounded-full gap-1.5 sm:gap-2 transition-colors duration-300 cursor-pointer", isOverDark ? "hover:bg-white/10" : "hover:bg-black/5")}>
              <span className={cn("h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300", isOverDark ? "bg-white/10 text-white" : "bg-primary/10 text-primary")}>
                {getInitials(user.name)}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-colors duration-300", isOverDark ? "text-white/60" : "text-black/50")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52" sideOffset={10}>
            <DropdownMenuLabel className="font-normal">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/platform/dashboard" className="flex items-center gap-2 cursor-pointer">
                <LayoutDashboard className="h-4 w-4" /> Go to Platform
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>"""

new_dropdown = """        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("h-9 px-2 sm:px-3 rounded-full gap-1.5 sm:gap-2 transition-colors duration-300 cursor-pointer", isOverDark ? "hover:bg-white/10" : "hover:bg-black/5")}>
              <span className={cn("h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300", isOverDark ? "bg-white/10 text-white" : "bg-black/5 text-black")}>
                {getInitials(user.name)}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-colors duration-300", isOverDark ? "text-white/60" : "text-black/50")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className={cn(
              "w-52 rounded-xl backdrop-blur-xl shadow-2xl transition-all p-1",
              isOverDark
                ? "bg-black/60 border-white/10 text-white"
                : "bg-white/70 border-black/10 text-black"
            )}
            sideOffset={15}
          >
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <p className="font-semibold truncate">{user.name}</p>
              <p className={cn("text-xs truncate", isOverDark ? "text-white/60" : "text-black/60")}>
                {user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={isOverDark ? "bg-white/10" : "bg-black/10"} />
            <DropdownMenuItem asChild className={cn("cursor-pointer rounded-lg", isOverDark ? "focus:bg-white/10 focus:text-white" : "focus:bg-black/5 focus:text-black")}>
              <Link href="/platform/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Go to Platform
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={isOverDark ? "bg-white/10" : "bg-black/10"} />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} className={cn("cursor-pointer rounded-lg text-red-500", isOverDark ? "focus:bg-red-500/10 focus:text-red-500" : "focus:bg-red-50 focus:text-red-600")}>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>"""

content = content.replace(old_dropdown, new_dropdown)

with open(file_path, "w") as f:
    f.write(content)

print("Dropdown fixed!")
