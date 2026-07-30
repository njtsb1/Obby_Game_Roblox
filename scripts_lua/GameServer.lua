local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

-- Ensure RemoteEvents exist
local function ensureRemote(name)
    local r = ReplicatedStorage:FindFirstChild(name)
    if not r then
        r = Instance.new("RemoteEvent")
        r.Name = name
        r.Parent = ReplicatedStorage
    end
    return r
end

local fireEvent = ensureRemote("FireProjectile")
local rotateEvent = ensureRemote("RequestRotate")
local moveEvent = ensureRemote("RequestMove")

-- Folders
local OBSTACLE_FOLDER = Workspace:FindFirstChild("Obstacles") or Instance.new("Folder", Workspace)
OBSTACLE_FOLDER.Name = "Obstacles"

local PROJECTILE_FOLDER = Workspace:FindFirstChild("Projectiles") or Instance.new("Folder", Workspace)
PROJECTILE_FOLDER.Name = "Projectiles"

-- Config
local SPAWN_INTERVAL = 1.2
local obstacleSpeedBase = 8
local lastSpawn = 0

local function createObstaclePart(shape)
    if shape == "triangle" then
        local wedge = Instance.new("WedgePart")
        wedge.Size = Vector3.new(4,4,1)
        wedge.Anchored = true
        wedge.BrickColor = BrickColor.new("Royal purple")
        wedge.Parent = OBSTACLE_FOLDER
        return wedge
    else
        local part = Instance.new("Part")
        part.Anchored = true
        part.CanCollide = true
        part.TopSurface = Enum.SurfaceType.Smooth
        part.BottomSurface = Enum.SurfaceType.Smooth
        part.Parent = OBSTACLE_FOLDER
        if shape == "square" then
            part.Size = Vector3.new(4,4,1)
            part.BrickColor = BrickColor.new("Bright red")
        elseif shape == "rect" then
            part.Size = Vector3.new(8,2,1)
            part.BrickColor = BrickColor.new("New Yeller")
        elseif shape == "diamond" then
            part.Size = Vector3.new(5,5,1)
            part.BrickColor = BrickColor.new("Bright blue")
        end
        return part
    end
end

local function spawnObstacle()
    local shapes = {"square","rect","diamond","triangle"}
    local shape = shapes[math.random(1,#shapes)]
    local part = createObstaclePart(shape)
    local spawnX = 200
    local spawnY = math.random(5, 40)
    part.Position = Vector3.new(spawnX, spawnY, 0)
    part:SetAttribute("Speed", obstacleSpeedBase + math.random()*4)
    part:SetAttribute("Behavior", math.random())
    return part
end

RunService.Heartbeat:Connect(function(dt)
    lastSpawn = lastSpawn + dt
    if lastSpawn >= SPAWN_INTERVAL then
        lastSpawn = 0
        spawnObstacle()
        obstacleSpeedBase = obstacleSpeedBase + 0.2
        if SPAWN_INTERVAL > 0.5 then SPAWN_INTERVAL = SPAWN_INTERVAL - 0.01 end
    end

    for _, obj in pairs(OBSTACLE_FOLDER:GetChildren()) do
        if obj:IsA("BasePart") then
            local speed = obj:GetAttribute("Speed") or obstacleSpeedBase
            local behavior = obj:GetAttribute("Behavior") or 0
            local pos = obj.Position
            pos = pos + Vector3.new(-speed * dt, 0, 0)
            if behavior > 0.4 and behavior <= 0.7 then
                pos = pos + Vector3.new(0, math.sin(tick() + obj:GetDebugId()) * 0.5, 0)
            end
            obj.Position = pos
            if obj.Position.X < -200 then
                obj:Destroy()
            end
        end
    end

    for _, p in pairs(PROJECTILE_FOLDER:GetChildren()) do
        if p:IsA("BasePart") then
            p.Position = p.Position + Vector3.new(30 * dt, 0, 0)
            for _, o in pairs(OBSTACLE_FOLDER:GetChildren()) do
                if o:IsA("BasePart") and (o.Position - p.Position).Magnitude < 3 then
                    o:Destroy()
                    p:Destroy()
                    break
                end
            end
            if p.Parent and p.Position.X > 300 then p:Destroy() end
        end
    end
end)

moveEvent.OnServerEvent:Connect(function(player, moveVec)
    local char = player.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    local newPos = hrp.Position + Vector3.new(moveVec.X, 0, moveVec.Z)
    newPos = Vector3.new(math.clamp(newPos.X, -180, 180), math.clamp(newPos.Y, 2, 60), hrp.Position.Z)
    hrp.CFrame = CFrame.new(newPos)
end)

rotateEvent.OnServerEvent:Connect(function(player)
    local char = player.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    local current = hrp.Orientation
    hrp.Orientation = Vector3.new(current.X, current.Y, (current.Z + 90) % 360)
end)

fireEvent.OnServerEvent:Connect(function(player)
    local char = player.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    local proj = Instance.new("Part")
    proj.Size = Vector3.new(0.5,0.5,0.5)
    proj.Anchored = true
    proj.CanCollide = false
    proj.BrickColor = BrickColor.new("New Yeller")
    proj.Position = hrp.Position + Vector3.new(3, 0, 0)
    proj.Parent = PROJECTILE_FOLDER
end)
