import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMatch, updateMatch } from "@/services/casinoService";
import {
  Button,
  Modal,
  Input,
  message,
  Spin,
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Popconfirm,
  InputNumber,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

interface Player {
  id: string;
  name: string;
}

interface Round {
  key: string;
  scores: { [playerId: string]: number };
}

interface MatchData {
  name: string;
  players: Player[];
  rounds: Round[];
}

export default function CasinoMatch() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  // Player Modal
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  // Round Modal
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [roundScores, setRoundScores] = useState<{ [playerId: string]: number }>({});

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    getMatch(matchId)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMatchData({
            name: data.name || "Unnamed Match",
            players: data.players || [],
            rounds: data.rounds || [],
          });
        } else {
          messageApi.error("Không tìm thấy ván đấu!");
          navigate("/app-pope/casino");
        }
      })
      .finally(() => setLoading(false));
  }, [matchId, navigate, messageApi]);

  const handleSave = async (newData: Partial<MatchData>) => {
    if (!matchId) return;
    try {
      // Update Firestore with only the changed fields
      await updateMatch(matchId, newData);

      // Update local state safely using the previous state
      setMatchData(prevData => ({
        ...prevData!,
        ...newData
      }));

      messageApi.success("Đã lưu thay đổi!");
    } catch (error) {
      messageApi.error("Lưu thất bại!");
    }
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
    };
    const newPlayers = [...(matchData?.players || []), newPlayer];
    handleSave({ players: newPlayers });
    setNewPlayerName("");
    setIsPlayerModalOpen(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    const newPlayers = matchData!.players.filter(p => p.id !== playerId);
    // Also remove scores of the deleted player from all rounds
    const newRounds = matchData!.rounds.map(round => {
        const newScores = { ...round.scores };
        delete newScores[playerId];
        return { ...round, scores: newScores };
    });
    handleSave({ players: newPlayers, rounds: newRounds });
  }

  const openRoundModal = (round: Round | null) => {
    setEditingRound(round);
    if (round) {
      setRoundScores(round.scores);
    } else {
      // Initialize scores for a new round
      const initialScores = matchData!.players.reduce((acc, player) => {
        acc[player.id] = 0;
        return acc;
      }, {} as { [playerId: string]: number });
      setRoundScores(initialScores);
    }
    setIsRoundModalOpen(true);
  };

  const handleSaveRound = () => {
    const total = Object.values(roundScores).reduce((sum, score) => sum + score, 0);
    if (total !== 0) {
      messageApi.error("Tổng điểm của ván phải bằng 0.");
      return;
    }

    let newRounds;
    if (editingRound) {
      // Update existing round
      newRounds = matchData!.rounds.map((r) =>
        r.key === editingRound.key ? { ...r, scores: roundScores } : r
      );
    } else {
      // Add new round
      const newRound: Round = {
        key: Date.now().toString(),
        scores: roundScores,
      };
      newRounds = [...(matchData?.rounds || []), newRound];
    }
    handleSave({ rounds: newRounds });
    setIsRoundModalOpen(false);
    setEditingRound(null);
  };

  const handleDeleteRound = (roundKey: string) => {
    const newRounds = matchData!.rounds.filter(r => r.key !== roundKey);
    handleSave({ rounds: newRounds });
  }

  const playerTotals = useMemo(() => {
    const totals: { [playerId: string]: number } = {};
    matchData?.players.forEach(p => { totals[p.id] = 0; });
    matchData?.rounds.forEach(round => {
        for (const playerId in round.scores) {
            if (totals[playerId] !== undefined) {
                totals[playerId] += round.scores[playerId];
            }
        }
    });
    return totals;
  }, [matchData]);

  const tableColumns = [
    { title: 'Ván #', dataIndex: 'roundNumber', key: 'roundNumber', width: 80 },
    ...(matchData?.players || []).map(player => ({
      title: player.name,
      dataIndex: ['scores', player.id],
      key: player.id,
      render: (score: number) => <span style={{ color: score > 0 ? 'green' : score < 0 ? 'red' : 'black' }}>{score > 0 ? `+${score}` : score}</span>
    })),
    {
        title: 'Hành động',
        key: 'action',
        width: 120,
        render: (_: any, record: any) => (
            <div className="flex gap-2">
                <Button icon={<EditOutlined />} onClick={() => openRoundModal(record.original)} />
                <Popconfirm title="Xóa ván này?" onConfirm={() => handleDeleteRound(record.key)}>
                    <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </div>
        )
    }
  ];

  const tableDataSource = [...(matchData?.rounds || [])]
    .reverse()
    .map((round, index, reversedArray) => ({
        key: round.key,
        roundNumber: reversedArray.length - index,
        scores: round.scores,
        original: round
  }));

  if (loading || !matchData) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {contextHolder}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/app-pope/casino')} />
            <h1 className="text-2xl font-bold text-gray-800">{matchData.name}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button icon={<PlusOutlined />} onClick={() => setIsPlayerModalOpen(true)}>Thêm người chơi</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoundModal(null)}>Thêm ván</Button>
        </div>
      </header>

      <Row gutter={[16, 16]} className="mb-6">
        {matchData.players.map(player => (
            <Col xs={12} sm={8} md={6} lg={4} key={player.id}>
                <Card size="small">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">{player.name}</span>
                        <Popconfirm title={`Xóa người chơi ${player.name}?`} onConfirm={() => handleDeletePlayer(player.id)}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </div>
                    <Statistic value={playerTotals[player.id]} valueStyle={{ color: playerTotals[player.id] > 0 ? 'green' : playerTotals[player.id] < 0 ? 'red' : 'black' }} />
                </Card>
            </Col>
        ))}
      </Row>

      <Card>
        <Table 
            columns={tableColumns} 
            dataSource={tableDataSource} 
            scroll={{ x: 'max-content' }} 
            pagination={false}
            bordered
            size="small"
        />
      </Card>

      {/* Modal: Add Player */}
      <Modal
        title="Thêm người chơi mới"
        open={isPlayerModalOpen}
        onCancel={() => setIsPlayerModalOpen(false)}
        onOk={handleAddPlayer}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên người chơi"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
        />
      </Modal>

      {/* Modal: Add/Edit Round */}
      <Modal
        title={editingRound ? "Sửa ván" : "Thêm ván mới"}
        open={isRoundModalOpen}
        onCancel={() => setIsRoundModalOpen(false)}
        onOk={handleSaveRound}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Spin spinning={!roundScores}>
            <p className="text-center font-bold mb-2">Tổng điểm: {Object.values(roundScores).reduce((s, v) => s + v, 0)}</p>
            <div className="max-h-[60vh] overflow-y-auto">
                {matchData.players.map(player => (
                    <Row key={player.id} align="middle" className="p-2 even:bg-gray-50">
                        <Col span={10}><span className="font-semibold">{player.name}</span></Col>
                        <Col span={14}>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setRoundScores(prev => ({...prev, [player.id]: (prev[player.id] || 0) - 1}))}>-1</Button>
                                <InputNumber 
                                    value={roundScores[player.id]}
                                    onChange={(value) => setRoundScores(prev => ({...prev, [player.id]: value || 0}))}
                                    className="flex-grow"
                                />
                                <Button onClick={() => setRoundScores(prev => ({...prev, [player.id]: (prev[player.id] || 0) + 1}))}>+1</Button>
                            </div>
                        </Col>
                    </Row>
                ))}
            </div>
        </Spin>
      </Modal>
    </div>
  );
}