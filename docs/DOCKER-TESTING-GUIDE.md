# Docker Compose Testing Guide

## ✅ Prerequisites Fixed

The Dockerfile has been updated to include CSV data files in the production image:
```dockerfile
# Copy CSV data files to the production image
COPY src/data ./dist/data
```

## 🚀 Running with Docker Compose

### 1. Build and Start the Container

```bash
docker-compose up --build
```

**What this does:**
- Builds the Docker image from scratch
- Installs dependencies
- Compiles TypeScript to JavaScript
- Copies CSV files to the image
- Starts the container
- Maps port 4000 to your localhost

### 2. Expected Console Output

You should see logs like this:

```
snapaml-app  | Initializing CSV Data Service...
snapaml-app  | Loaded XXXXX registry entries
snapaml-app  | Loaded XXXXX tax entries
snapaml-app  | Loaded XXXXX insolvency entries
snapaml-app  | CSV Data Service initialized successfully
snapaml-app  | Server is running on port 4000
snapaml-app  | Health check: http://localhost:4000/health
snapaml-app  | Company endpoint: http://localhost:4000/api/company
```

**✅ If you see this:** Your container is running successfully!

**❌ If you see errors:** Check the troubleshooting section below.

## 🧪 Testing the Dockerized Service

### Test 1: Health Check

Open a **new terminal** (keep docker-compose running in the first one):

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

### Test 2: Company Risk Profile

```bash
curl -X POST http://localhost:4000/api/company \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber": "12345678901"}'
```

**Note:** Replace `12345678901` with an actual registration number from your CSV files.

**Expected Success Response (200):**
```json
{
  "success": true,
  "data": {
    "registration_number": "12345678901",
    "company_name": "Example SIA",
    "address": "...",
    "is_active": true,
    "overall_risk_level": "LOW",
    ...
  }
}
```

**Expected Error if Not Found (404):**
```json
{
  "success": false,
  "error": "Company not found in Latvian Registry"
}
```

### Test 3: Using Postman/Thunder Client

**Settings:**
- **Method:** POST
- **URL:** `http://localhost:4000/api/company`
- **Headers:**
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "registrationNumber": "YOUR_REG_NUMBER"
}
```

## 📊 Container Management Commands

### View Running Containers
```bash
docker-compose ps
```

### View Real-Time Logs
```bash
docker-compose logs -f
```

### Stop the Container
```bash
docker-compose down
```

### Restart After Changes
```bash
docker-compose down
docker-compose up --build
```

### Clean Everything (Remove Images Too)
```bash
docker-compose down --rmi all
```

## 🔍 Verifying CSV Data Inside Container

To check if CSV files are actually inside the container:

```bash
# List running containers
docker ps

# Access the container shell
docker exec -it snapaml-app sh

# Inside container, check CSV files exist
ls -la /app/dist/data/csv/

# You should see:
# registry.csv
# taxpayer_rating.csv
# insolvency.csv

# Exit container
exit
```

## 🐛 Troubleshooting

### Problem: Container Keeps Restarting

**Check logs:**
```bash
docker-compose logs snapaml-app
```

**Common causes:**
1. **CSV files missing** - Fixed by the Dockerfile update
2. **Port already in use** - Change port in docker-compose.yml
3. **Environment variables missing** - Check .env file
4. **Supabase connection failed** - Verify credentials

### Problem: "Cannot find module" Error

**Solution:** Rebuild without cache
```bash
docker-compose build --no-cache
docker-compose up
```

### Problem: Port 4000 Already in Use

**Option 1:** Kill the process using port 4000
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

**Option 2:** Change the port in docker-compose.yml
```yaml
ports:
  - "3001:4000"  # Use 3001 on host, 4000 in container
```

Then access via `http://localhost:3001`

### Problem: Environment Variables Not Working

**Check your .env file exists and has:**
```env
SUPABASE_URL=your_url
SUPABASE_PUBLISHABLE_KEY=your_key
SUPABASE_PROJECT_ID=your_id
PORT=4000
```

**Rebuild after .env changes:**
```bash
docker-compose down
docker-compose up --build
```

### Problem: Health Check Failing

The docker-compose.yml has a health check that uses `wget`. If it fails:

1. **Check logs:** `docker-compose logs`
2. **Test manually:** `curl http://localhost:4000/health`
3. **Container might be starting slowly:** Wait 40 seconds (start_period)

## 🎯 Performance Testing

### Check Memory Usage
```bash
docker stats snapaml-app
```

You should see something like:
```
CONTAINER      CPU %   MEM USAGE / LIMIT   MEM %
snapaml-app    0.1%    150MiB / 1GiB      15%
```

**Expected Memory:**
- Base: ~100-150MB
- With CSV data loaded: ~200-500MB (depends on CSV file sizes)
- Under load: May increase to ~600MB-1GB

### Load Testing with Multiple Requests

```bash
# Install apache bench (if needed)
# Windows: Download from Apache website
# Mac: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Run 100 requests, 10 concurrent
ab -n 100 -c 10 -p test-payload.json -T application/json \
  http://localhost:4000/api/company
```

**test-payload.json:**
```json
{"registrationNumber": "12345678901"}
```

## ✅ Success Checklist

- [ ] `docker-compose up --build` runs without errors
- [ ] Console shows "CSV Data Service initialized successfully"
- [ ] Console shows all 3 CSV files loaded with entry counts
- [ ] Console shows "Server is running on port 4000"
- [ ] Health check `curl http://localhost:4000/health` returns 200
- [ ] Company endpoint returns data for valid registration number
- [ ] Company endpoint returns 404 for invalid registration number
- [ ] Container health check passes (check with `docker ps`)
- [ ] Memory usage is reasonable (<1GB)

## 🚀 Next Steps After Testing

Once your Docker container works locally:

1. **Push to Docker Hub** (optional):
```bash
docker tag snapaml-app:latest yourusername/snapaml:latest
docker push yourusername/snapaml:latest
```

2. **Deploy to Fly.io**:
```bash
fly launch
fly deploy
```

3. **Deploy to other platforms**:
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

## 📝 Quick Reference

**Start:** `docker-compose up --build`
**Stop:** `docker-compose down` (or Ctrl+C)
**Logs:** `docker-compose logs -f`
**Test:** `curl http://localhost:4000/health`
**Shell:** `docker exec -it snapaml-app sh`

## 🎉 You're Ready!

If all tests pass, your application is successfully running in Docker and ready for deployment to any container platform including Fly.io!
