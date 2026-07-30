local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local character = nil
local hrp = nil

local fireEvent = ReplicatedStorage:WaitForChild("FireProjectile")
local rotateEvent = ReplicatedStorage:WaitForChild("RequestRotate")
local moveEvent = ReplicatedStorage:WaitForChild("RequestMove")

-- Config
local MOVE_SPEED = 6
local ROTATION_COOLDOWN = 0.3
local SHOOT_COOLDOWN = 0.3

local canRotate = true
local canShoot = true

local inputState = {
    up = false,
    down = false,
    left = false,
    right = false
}

local function onCharacterAdded(char)
    character = char
    hrp = char:WaitForChild("HumanoidRootPart")
end

if player.Character then
    onCharacterAdded(player.Character)
end
player.CharacterAdded:Connect(onCharacterAdded)

local function sendMovement(dt)
    if not hrp then return end
    local moveVec = Vector3.new(0,0,0)
    if inputState.up then moveVec = moveVec + Vector3.new(0, 0, -1) end
    if inputState.down then moveVec = moveVec + Vector3.new(0, 0, 1) end
    if inputState.left then moveVec = moveVec + Vector3.new(-1, 0, 0) end
    if inputState.right then moveVec = moveVec + Vector3.new(1, 0, 0) end
    if moveVec.Magnitude > 0 then
        moveVec = moveVec.Unit * MOVE_SPEED * dt * 60
        moveEvent:FireServer(moveVec)
    end
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    local key = input.KeyCode
    if key == Enum.KeyCode.W or key == Enum.KeyCode.Up then inputState.up = true end
    if key == Enum.KeyCode.S or key == Enum.KeyCode.Down then inputState.down = true end
    if key == Enum.KeyCode.A or key == Enum.KeyCode.Left then inputState.left = true end
    if key == Enum.KeyCode.D or key == Enum.KeyCode.Right then inputState.right = true end

    if key == Enum.KeyCode.Space then
        if canRotate then
            canRotate = false
            rotateEvent:FireServer()
            delay(ROTATION_COOLDOWN, function() canRotate = true end)
        end
    end

    if key == Enum.KeyCode.D then
        if canShoot then
            canShoot = false
            fireEvent:FireServer()
            delay(SHOOT_COOLDOWN, function() canShoot = true end)
        end
    end
end)

UserInputService.InputEnded:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    local key = input.KeyCode
    if key == Enum.KeyCode.W or key == Enum.KeyCode.Up then inputState.up = false end
    if key == Enum.KeyCode.S or key == Enum.KeyCode.Down then inputState.down = false end
    if key == Enum.KeyCode.A or key == Enum.KeyCode.Left then inputState.left = false end
    if key == Enum.KeyCode.D or key == Enum.KeyCode.Right then inputState.right = false end
end)

local last = tick()
RunService.RenderStepped:Connect(function()
    local now = tick()
    local dt = now - last
    last = now
    sendMovement(dt)
end)
