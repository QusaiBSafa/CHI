# 🚀 Vercel Deployment Guide for CHI Backend

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a cloud MongoDB database
3. **Vercel CLI**: Install globally with `npm install -g vercel`

## 🛠️ Deployment Steps

### **Step 1: Prepare Your Project**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

### **Step 2: Set Up MongoDB Atlas**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Get your connection string (replace `<password>` with your password)
4. Example: `mongodb+srv://username:password@cluster.mongodb.net/chi_db?retryWrites=true&w=majority`

### **Step 3: Deploy to Vercel**

1. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/chi-project
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project? **No**
   - Project name: `chi-backend` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings? **No**

### **Step 4: Configure Environment Variables**

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these variables**:

   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/chi_db?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   ```

### **Step 5: Redeploy**

After setting environment variables:
```bash
vercel --prod
```

## 🔧 Important Considerations

### **⚠️ Vercel Limitations**

1. **Serverless Functions**: Vercel runs your app as serverless functions
2. **Cold Starts**: First request might be slower
3. **Database Connections**: Use connection pooling
4. **File System**: No persistent file system

### **🔄 Database Connection Optimization**

Your current setup should work, but consider:

1. **Connection Pooling**: TypeORM handles this automatically
2. **Connection Timeout**: Set appropriate timeouts
3. **Reconnection Logic**: Handle connection drops

### **📊 Monitoring**

1. **Vercel Analytics**: Built-in performance monitoring
2. **Function Logs**: Check Vercel dashboard for logs
3. **Database Monitoring**: Use MongoDB Atlas monitoring

## 🧪 Testing Your Deployment

### **Health Check**
```bash
curl https://your-app.vercel.app/health
```

### **API Documentation**
```bash
https://your-app.vercel.app/docs
```

### **Test Endpoints**
```bash
# Register user
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Build Failures**:
   - Check TypeScript compilation
   - Verify all dependencies are in `package.json`

2. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check network access in MongoDB Atlas

3. **Environment Variables**:
   - Ensure all required env vars are set in Vercel dashboard
   - Redeploy after adding new variables

4. **Function Timeouts**:
   - Vercel has a 10-second timeout for hobby plans
   - Consider upgrading for longer operations

### **Debug Commands**

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Redeploy
vercel --prod
```

## 📈 Performance Optimization

1. **Enable Caching**: Use Vercel's edge caching
2. **Optimize Dependencies**: Remove unused packages
3. **Database Indexing**: Add indexes to frequently queried fields
4. **Connection Pooling**: Configure TypeORM connection pool

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets
2. **CORS Configuration**: Set appropriate origins
3. **JWT Secrets**: Use strong, random secrets
4. **Database Access**: Use MongoDB Atlas IP whitelisting

## 📝 Next Steps

1. **Set up CI/CD**: Connect to GitHub for automatic deployments
2. **Add Monitoring**: Set up error tracking (Sentry, etc.)
3. **Performance Monitoring**: Use Vercel Analytics
4. **Backup Strategy**: Regular database backups

---

## 🎉 Success!

Your CHI backend should now be running on Vercel! 

**Your API will be available at**: `https://your-app.vercel.app`

**Swagger Documentation**: `https://your-app.vercel.app/docs`
