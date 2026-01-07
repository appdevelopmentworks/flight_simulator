declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
  }
  
  interface Process {
    env: ProcessEnv;
  }
}

// Allow NODE_ENV to be written in tests
declare var process: NodeJS.Process & {
  env: {
    NODE_ENV: string;
  };
};
