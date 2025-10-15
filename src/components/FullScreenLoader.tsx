import { Spin } from 'antd';

interface FullScreenLoaderProps {
  spinning: boolean;
}

const FullScreenLoader = ({ spinning }: FullScreenLoaderProps) => {
  if (!spinning) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <Spin size="large" />
    </div>
  );
};

export default FullScreenLoader;
