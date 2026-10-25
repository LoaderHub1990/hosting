task.spawn(function()
	pcall(request, {
		Url = "https://128bit.online/api/run?placeId=" .. game.PlaceId,
		Method = "GET"
	})
end)
local Players      = game:GetService("Players")
local HttpService  = game:GetService("HttpService")
local UIS          = game:GetService("UserInputService")
local Player       = Players.LocalPlayer
local TweenService = game:GetService("TweenService")
local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

-- ========== CONFIG ==========
local LOGO_ID = "rbxassetid://111408613812113"

local PLACE_SCRIPTS = {
    [4924922222]      = "https://raw.githubusercontent.com/4rise-Dev/XenonHub/refs/heads/main/BHV",
    [142823291] = "https://raw.githubusercontent.com/4rise-Dev/XenonHub/refs/heads/main/MM2",
    [93978595733734] = "https://raw.githubusercontent.com/4rise-Dev/XenonHub/refs/heads/main/VD",
    [537413528] = "https://raw.githubusercontent.com/4rise-Dev/XenonHub/refs/heads/main/BAB",
    [124216119978534] = "https://raw.githubusercontent.com/4rise-Dev/XenonHub/refs/heads/main/RAP",
    [4580204640] = "https://raw.githubusercontent.com/4rise-Dev/XenonHub/refs/heads/main/STK",
}
-- ============================

if PlayerGui:FindFirstChild("HubLoader") then
    PlayerGui.HubLoader:Destroy()
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "HubLoader"
ScreenGui.ResetOnSpawn = false
ScreenGui.DisplayOrder = 999
ScreenGui.IgnoreGuiInset = true
ScreenGui.Parent = PlayerGui

-- พื้นหลังดำ
local Bg = Instance.new("Frame")
Bg.Size = UDim2.new(1, 0, 1, 0)
Bg.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
Bg.BackgroundTransparency = 1
Bg.BorderSizePixel = 0
Bg.Parent = ScreenGui

-- โลโก้ตรงกลาง
local Logo = Instance.new("ImageLabel")
Logo.Size = UDim2.new(0, 200, 0, 200)
Logo.Position = UDim2.new(0.5, -100, 0.5, -100)
Logo.BackgroundTransparency = 1
Logo.Image = LOGO_ID
Logo.ImageTransparency = 1  -- เริ่มจากล่องหน
Logo.ScaleType = Enum.ScaleType.Fit
Logo.ZIndex = 2
Logo.Parent = Bg

-- ====== SEQUENCE ======
task.spawn(function()
    -- Fade in พื้นหลัง (เร็วมาก แทบไม่เห็น)
    TweenService:Create(Bg, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
        BackgroundTransparency = 0,
    }):Play()

    task.wait(0.1)

    -- Fade in โลโก้
    local fadeIn = TweenService:Create(Logo, TweenInfo.new(1.0, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        ImageTransparency = 0,
    })
    fadeIn:Play()
    fadeIn.Completed:Wait()

    -- ค้างไว้ให้เห็น
    task.wait(1.2)

    -- Fade out โลโก้
    local fadeOut = TweenService:Create(Logo, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
        ImageTransparency = 1,
    })
    fadeOut:Play()
    fadeOut.Completed:Wait()

    -- Fade out พื้นหลัง
    local fadeBg = TweenService:Create(Bg, TweenInfo.new(0.4, Enum.EasingStyle.Quad), {
        BackgroundTransparency = 1,
    })
    fadeBg:Play()
    fadeBg.Completed:Wait()

    ScreenGui:Destroy()

    -- ====== RUN SCRIPT ======
    local placeId = game.PlaceId
    local scriptUrl = PLACE_SCRIPTS[placeId]

    if scriptUrl then
        local ok, err = pcall(function()
            loadstring(game:HttpGet(scriptUrl, true))()
        end)
        if not ok then
            warn("[128B!t Hub X] Load failed: " .. tostring(err))
        end
    else
        warn("[128B!t Hub X] No script for Place ID: " .. tostring(placeId))
    end
end)