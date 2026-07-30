local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local Modules = ReplicatedStorage:WaitForChild("Modules")
local LangModule = require(Modules:WaitForChild("LangModule"))

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ObbyGUI"
screenGui.ResetOnSpawn = false
screenGui.Parent = player:WaitForChild("PlayerGui")

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 420, 0, 60)
frame.Position = UDim2.new(0.02, 0, 0.02, 0)
frame.BackgroundTransparency = 0.2
frame.BackgroundColor3 = Color3.fromRGB(20,20,30)
frame.Parent = screenGui

local scoreLabel = Instance.new("TextLabel")
scoreLabel.Size = UDim2.new(0, 140, 1, 0)
scoreLabel.Position = UDim2.new(0, 8, 0, 0)
scoreLabel.BackgroundTransparency = 1
scoreLabel.TextColor3 = Color3.new(1,1,1)
scoreLabel.Text = "Score: 0"
scoreLabel.Parent = frame

local savedLabel = scoreLabel:Clone()
savedLabel.Position = UDim2.new(0, 150, 0, 0)
savedLabel.Text = "Saved: 0"
savedLabel.Parent = frame

local lostLabel = scoreLabel:Clone()
lostLabel.Position = UDim2.new(0, 290, 0, 0)
lostLabel.Text = "Lost: 0"
lostLabel.Parent = frame

local lang = "en-US"
local function applyLang()
    scoreLabel.Text = LangModule.get(lang, "score") .. ": 0"
    savedLabel.Text = LangModule.get(lang, "saved") .. ": 0"
    lostLabel.Text = LangModule.get(lang, "lost") .. ": 0"
end
applyLang()

local isLight = false
local function toggleTheme()
    isLight = not isLight
    if isLight then
        frame.BackgroundColor3 = Color3.fromRGB(250,250,250)
        scoreLabel.TextColor3 = Color3.fromRGB(10,10,10)
        savedLabel.TextColor3 = Color3.fromRGB(10,10,10)
        lostLabel.TextColor3 = Color3.fromRGB(10,10,10)
    else
        frame.BackgroundColor3 = Color3.fromRGB(20,20,30)
        scoreLabel.TextColor3 = Color3.new(1,1,1)
        savedLabel.TextColor3 = Color3.new(1,1,1)
        lostLabel.TextColor3 = Color3.new(1,1,1)
    end
end

screenGui:SetAttribute("Lang", lang)
screenGui:SetAttribute("IsLight", isLight)
